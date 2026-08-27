import '../models/app_notification.dart';

DateTime _hoursAgo(int h) => DateTime.now().subtract(Duration(hours: h));

class MockNotifications {
  MockNotifications._();

  static List<AppNotification> all() => [
        AppNotification(
          id: 'n1',
          title: 'Deadline tomorrow',
          body: 'Smart India Hackathon 2026 registration closes tomorrow.',
          kind: NotificationKind.deadline,
          createdAt: _hoursAgo(2),
          targetOpportunityId: 'hack-sih-2026',
        ),
        AppNotification(
          id: 'n2',
          title: 'New AI hackathon matching your interests',
          body: 'Delhi AI Build Summit is open for registration.',
          kind: NotificationKind.recommendation,
          createdAt: _hoursAgo(7),
          targetOpportunityId: 'hack-delhi-ai-summit',
        ),
        AppNotification(
          id: 'n3',
          title: 'New NSUT research opportunity',
          body: 'NSUT AI & Vision Lab is accepting research interns.',
          kind: NotificationKind.recommendation,
          createdAt: _hoursAgo(20),
          targetOpportunityId: 'res-nsut-ai-lab',
        ),
        AppNotification(
          id: 'n4',
          title: 'Your saved scholarship deadline is in 6 days',
          body: 'Reliance Foundation Undergraduate Scholarship closes soon.',
          kind: NotificationKind.deadline,
          createdAt: _hoursAgo(26),
          read: true,
          targetOpportunityId: 'sch-reliance-ug',
        ),
        AppNotification(
          id: 'n5',
          title: 'NSUT News',
          body: 'Mid-semester examination datesheet released for Semester 5.',
          kind: NotificationKind.news,
          createdAt: _hoursAgo(30),
          read: true,
          targetNewsId: 'news-1',
        ),
        AppNotification(
          id: 'n6',
          title: 'GSoC organisations announced',
          body: 'Start shortlisting orgs — proposals are due in three weeks.',
          kind: NotificationKind.recommendation,
          createdAt: _hoursAgo(52),
          read: true,
          targetOpportunityId: 'os-gsoc',
        ),
      ];
}
