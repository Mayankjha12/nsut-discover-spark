import '../../data/models/enums.dart';
import '../../data/models/opportunity.dart';
import '../../data/models/user_profile.dart';

/// Signals collected from behaviour: saves, views and searches.
class BehaviourSignals {
  const BehaviourSignals({
    this.savedTags = const {},
    this.viewedCategories = const {},
    this.searches = const [],
  });

  /// tag -> weight
  final Map<String, int> savedTags;

  /// category -> view count
  final Map<OpportunityCategory, int> viewedCategories;
  final List<String> searches;
}

class ScoredOpportunity {
  const ScoredOpportunity(this.opportunity, this.score, this.reason);

  final Opportunity opportunity;
  final double score;
  final String reason;
}

/// Deterministic, explainable ranking. Kept out of the UI so it can move to the
/// backend later without touching a single widget.
class RecommendationService {
  const RecommendationService();

  List<ScoredOpportunity> rank({
    required List<Opportunity> items,
    required UserProfile profile,
    required BehaviourSignals signals,
    DateTime? now,
  }) {
    final today = now ?? DateTime.now();
    final scored = <ScoredOpportunity>[];

    for (final o in items) {
      if (o.deadline.isBefore(today)) continue;

      double score = 0;
      final reasons = <String>[];

      // Interest match (strongest signal)
      final interestHits = profile.interests
          .where((i) => _mentions(o, i))
          .toList();
      if (interestHits.isNotEmpty) {
        score += 4.0 * interestHits.length;
        reasons.add(interestHits.take(2).join(' & '));
      }

      // Skills the student already listed
      final skillHits = profile.skills.where((s) => _mentions(o, s)).length;
      score += 1.5 * skillHits;

      // Tags similar to what they have saved before
      for (final tag in o.tags) {
        final weight = signals.savedTags[tag.toLowerCase()] ?? 0;
        if (weight > 0) {
          score += 1.2 * weight;
          reasons.add(tag);
        }
      }

      // Categories they browse often
      final views = signals.viewedCategories[o.category] ?? 0;
      score += 0.8 * views;

      // Recent searches
      for (final term in signals.searches.take(5)) {
        if (term.trim().length > 2 && _mentions(o, term)) score += 1.0;
      }

      // Year relevance
      if (profile.year <= 2 && o.beginnerFriendly) score += 2.0;
      if (profile.year >= 3 &&
          (o.category == OpportunityCategory.internships ||
              o.category == OpportunityCategory.research)) {
        score += 1.5;
      }

      // NSUT-local content is always relevant
      if (o.location.toLowerCase().contains('nsut') ||
          o.organization.toLowerCase().contains('nsut')) {
        score += 2.5;
        reasons.add('NSUT campus');
      }

      // Popularity and urgency nudges
      score += o.popularity / 40.0;
      final days = o.deadline.difference(today).inDays;
      if (days <= 7) score += 1.2;
      if (days <= 2) score += 0.8;

      scored.add(ScoredOpportunity(
        o,
        score,
        reasons.isEmpty
            ? 'Popular with NSUT students'
            : 'Because you follow ${_dedupe(reasons).take(2).join(' & ')}',
      ));
    }

    scored.sort((a, b) => b.score.compareTo(a.score));
    return scored;
  }

  String headline(UserProfile profile, BehaviourSignals signals) {
    final top = signals.savedTags.entries.toList()
      ..sort((a, b) => b.value.compareTo(a.value));
    if (top.length >= 2) {
      return 'Because you saved ${_title(top[0].key)} & ${_title(top[1].key)} opportunities';
    }
    if (profile.interests.length >= 2) {
      return 'Because you follow ${profile.interests[0]} & ${profile.interests[1]}';
    }
    return 'Picked for ${profile.branch.label}, ${profile.yearLabel}';
  }

  static bool _mentions(Opportunity o, String term) {
    final t = term.toLowerCase();
    return o.title.toLowerCase().contains(t) ||
        o.description.toLowerCase().contains(t) ||
        o.tags.any((x) => x.toLowerCase().contains(t)) ||
        o.skills.any((x) => x.toLowerCase().contains(t));
  }

  static List<String> _dedupe(List<String> input) {
    final seen = <String>{};
    return input.where((e) => seen.add(e.toLowerCase())).toList();
  }

  static String _title(String s) =>
      s.isEmpty ? s : s[0].toUpperCase() + s.substring(1);
}
