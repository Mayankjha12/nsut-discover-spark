import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../data/models/enums.dart';
import '../../data/models/user_profile.dart';
import '../../data/repositories/profile_repository.dart';
import 'repository_providers.dart';

class ProfileNotifier extends StateNotifier<UserProfile> {
  ProfileNotifier(this._repo) : super(UserProfile.demo) {
    _load();
  }

  final ProfileRepository _repo;

  Future<void> _load() async {
    final profile = await _repo.load();
    if (mounted) state = profile;
  }

  void update(UserProfile profile) {
    state = profile;
    _repo.save(profile);
  }

  void setBranch(Branch branch) => update(state.copyWith(branch: branch));

  void setYear(int year) => update(state.copyWith(year: year));

  void toggleInterest(String interest) {
    final next = [...state.interests];
    next.contains(interest) ? next.remove(interest) : next.add(interest);
    update(state.copyWith(interests: next));
  }

  void setSkills(List<String> skills) => update(state.copyWith(skills: skills));

  void completeOnboarding() => update(state.copyWith(onboarded: true));

  void setDefaultReminder(ReminderOption option) =>
      update(state.copyWith(defaultReminder: option));

  void setNotificationPref(String category, bool enabled) {
    final prefs = {...state.notificationPrefs, category: enabled};
    update(state.copyWith(notificationPrefs: prefs));
  }
}

final profileProvider =
    StateNotifierProvider<ProfileNotifier, UserProfile>((ref) {
  return ProfileNotifier(ref.watch(profileRepositoryProvider));
});

/// "Good morning / afternoon / evening" based on the device clock.
final greetingProvider = Provider<String>((ref) {
  final hour = DateTime.now().hour;
  if (hour < 12) return 'Good morning';
  if (hour < 17) return 'Good afternoon';
  return 'Good evening';
});
