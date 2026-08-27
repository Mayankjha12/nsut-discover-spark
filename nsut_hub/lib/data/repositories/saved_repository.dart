import 'dart:convert';

import 'package:shared_preferences/shared_preferences.dart';

import '../models/enums.dart';
import '../models/saved_item.dart';

/// Local-first save store. Writes land instantly (optimistic UI) and are later
/// mirrored to `/me/saved` once the backend exists.
abstract class SavedRepository {
  Future<List<SavedItem>> loadItems();
  Future<List<SavedCollection>> loadCollections();
  Future<void> persistItems(List<SavedItem> items);
  Future<void> persistCollections(List<SavedCollection> collections);
}

class LocalSavedRepository implements SavedRepository {
  static const _itemsKey = 'nsut_hub.saved_items.v1';
  static const _collectionsKey = 'nsut_hub.saved_collections.v1';

  @override
  Future<List<SavedItem>> loadItems() async {
    final prefs = await SharedPreferences.getInstance();
    final raw = prefs.getString(_itemsKey);
    if (raw == null) return _seed();
    try {
      return (jsonDecode(raw) as List)
          .map((e) => SavedItem.fromJson(e as Map<String, dynamic>))
          .toList();
    } catch (_) {
      return const [];
    }
  }

  @override
  Future<List<SavedCollection>> loadCollections() async {
    final prefs = await SharedPreferences.getInstance();
    final raw = prefs.getString(_collectionsKey);
    if (raw == null) return SavedCollection.defaults;
    try {
      return (jsonDecode(raw) as List)
          .map((e) => SavedCollection.fromJson(e as Map<String, dynamic>))
          .toList();
    } catch (_) {
      return SavedCollection.defaults;
    }
  }

  @override
  Future<void> persistItems(List<SavedItem> items) async {
    final prefs = await SharedPreferences.getInstance();
    await prefs.setString(
        _itemsKey, jsonEncode(items.map((e) => e.toJson()).toList()));
  }

  @override
  Future<void> persistCollections(List<SavedCollection> collections) async {
    final prefs = await SharedPreferences.getInstance();
    await prefs.setString(_collectionsKey,
        jsonEncode(collections.map((e) => e.toJson()).toList()));
  }

  /// A few pre-saved items so the demo build never opens on an empty Saved tab.
  List<SavedItem> _seed() {
    final now = DateTime.now();
    return [
      SavedItem(
        id: 's1',
        itemId: 'hack-sih-2026',
        type: SavedItemType.opportunity,
        savedAt: now.subtract(const Duration(days: 2)),
        collectionIds: const ['apply-this-week', 'important'],
        reminder: ReminderOption.oneDay,
      ),
      SavedItem(
        id: 's2',
        itemId: 'res-nsut-ai-lab',
        type: SavedItemType.opportunity,
        savedAt: now.subtract(const Duration(days: 3)),
        collectionIds: const ['research'],
        reminder: ReminderOption.threeDays,
      ),
      SavedItem(
        id: 's3',
        itemId: 'sch-reliance-ug',
        type: SavedItemType.opportunity,
        savedAt: now.subtract(const Duration(days: 1)),
        collectionIds: const ['important'],
      ),
      SavedItem(
        id: 's4',
        itemId: 'os-gsoc',
        type: SavedItemType.opportunity,
        savedAt: now.subtract(const Duration(hours: 6)),
      ),
      SavedItem(
        id: 's5',
        itemId: 'r5',
        type: SavedItemType.resource,
        savedAt: now.subtract(const Duration(days: 4)),
      ),
      SavedItem(
        id: 's6',
        itemId: 'news-2',
        type: SavedItemType.news,
        savedAt: now.subtract(const Duration(days: 1)),
      ),
      SavedItem(
        id: 's7',
        itemId: 'int-google-step',
        type: SavedItemType.opportunity,
        savedAt: now.subtract(const Duration(hours: 20)),
        collectionIds: const ['summer-internships'],
        reminder: ReminderOption.threeDays,
      ),
    ];
  }
}
