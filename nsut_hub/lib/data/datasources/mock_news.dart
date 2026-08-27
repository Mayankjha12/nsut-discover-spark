import '../models/enums.dart';
import '../models/news_item.dart';

DateTime _ago(int days) {
  final now = DateTime.now();
  return DateTime(now.year, now.month, now.day - days, 11, 30);
}

class MockNews {
  MockNews._();

  static List<NewsItem> all() => [
        NewsItem(
          id: 'news-1',
          title: 'Mid-semester examination datesheet released for Semester 5',
          category: NewsCategory.academics,
          publishedAt: _ago(0),
          source: 'Examination Division, NSUT',
          summary:
              'The datesheet for mid-semester examinations across all B.Tech branches has been published. Exams begin next week.',
          body:
              'The Examination Division has released the mid-semester examination datesheet for all B.Tech programmes. Examinations will be conducted in the morning and afternoon slots at the Dwarka campus. Students must carry their institute identity card and admit card to the examination hall. Any clash in the datesheet must be reported to the department office within three working days.',
          quickSummary: const QuickSummary(
            what: 'Mid-semester exam datesheet for Semester 5 is out',
            who: 'All B.Tech students in Semester 5',
            deadline: 'Report clashes within 3 working days',
            action: 'Download the datesheet and check your slot allocation',
          ),
          isImportant: true,
        ),
        NewsItem(
          id: 'news-2',
          title: 'Placement season 2026: 42 companies registered so far',
          category: NewsCategory.placements,
          publishedAt: _ago(1),
          source: 'Training & Placement Cell',
          summary:
              'The T&P cell confirms 42 recruiters for the upcoming season with the highest package at ₹64 LPA.',
          body:
              'The Training and Placement Cell has confirmed participation from 42 recruiters across software, analytics, core engineering and finance profiles. Pre-placement talks begin from next month. Students are advised to complete their profile on the placement portal, upload a verified resume and clear the resume review round conducted by the student placement coordinators.',
          quickSummary: const QuickSummary(
            what: '42 recruiters confirmed for placement season 2026',
            who: 'Final year students registered with the T&P cell',
            deadline: 'Resume upload before pre-placement talks begin',
            action: 'Complete your placement portal profile and resume review',
          ),
          isImportant: true,
        ),
        NewsItem(
          id: 'news-3',
          title: 'NSUT team wins national round of the Smart Manufacturing Challenge',
          category: NewsCategory.achievements,
          publishedAt: _ago(2),
          source: 'NSUT Media Cell',
          summary:
              'A four-member MPAE team secured first place with an automated defect detection system.',
          body:
              'A team from the Manufacturing Processes and Automation Engineering division won the national round of the Smart Manufacturing Challenge held in Pune. Their project used a low-cost camera rig and an edge ML model to detect casting defects in real time on the shop floor. The team receives a cash prize and an industry pilot opportunity.',
        ),
        NewsItem(
          id: 'news-4',
          title: 'Applications open for the NSUT Research Excellence Grant',
          category: NewsCategory.research,
          publishedAt: _ago(3),
          source: 'Dean (Research), NSUT',
          summary:
              'Undergraduate students can apply for grants of up to ₹1,00,000 for supervised research projects.',
          body:
              'The office of the Dean (Research) invites applications for the annual research excellence grant. Undergraduate students working under a faculty supervisor may apply with a two-page proposal outlining objectives, methodology, budget and expected outcomes. Selected projects receive funding for equipment, cloud credits and conference travel.',
          quickSummary: const QuickSummary(
            what: 'Research grant of up to ₹1,00,000 for UG projects',
            who: 'UG students with a faculty supervisor',
            deadline: 'Proposal submission within three weeks',
            action: 'Submit a two-page proposal through your department',
          ),
          isImportant: true,
        ),
        NewsItem(
          id: 'news-5',
          title: 'Scholarship portal verification window extended',
          category: NewsCategory.scholarships,
          publishedAt: _ago(4),
          source: 'Student Welfare Office',
          summary:
              'Document verification for the Delhi Higher Education scholarship has been extended by ten days.',
          body:
              'Students who applied for the Delhi Higher Education Merit Scholarship can now complete institute-level document verification until the extended date. Required documents include the domicile certificate, income certificate, latest fee receipt and consolidated marksheet. Verification happens at the Student Welfare Office between 10 AM and 4 PM on working days.',
          quickSummary: const QuickSummary(
            what: 'Scholarship document verification window extended',
            who: 'Applicants of the Delhi Higher Education Merit Scholarship',
            deadline: 'Extended by 10 days from the original date',
            action: 'Visit the Student Welfare Office with original documents',
          ),
        ),
        NewsItem(
          id: 'news-6',
          title: 'Inter-college sports meet: NSUT finishes runners-up',
          category: NewsCategory.sports,
          publishedAt: _ago(5),
          source: 'Sports Council',
          summary:
              'The contingent brought home 14 medals across athletics, badminton and basketball.',
          body:
              'NSUT finished as runners-up at the inter-college sports meet with a total of 14 medals. The badminton and basketball teams reached the finals while the athletics squad contributed five medals. Trials for the next tournament will be announced by the Sports Council shortly.',
        ),
        NewsItem(
          id: 'news-7',
          title: 'New elective baskets approved for Semester 6 and 7',
          category: NewsCategory.academics,
          publishedAt: _ago(6),
          source: 'Academic Council',
          summary:
              'Electives in generative AI, quantum computing and sustainable systems have been added.',
          body:
              'The Academic Council has approved three new elective baskets effective from the next academic session. Courses on generative AI systems, quantum computing fundamentals and sustainable engineering systems will be offered to Semester 6 and 7 students across branches, subject to a minimum enrolment threshold.',
        ),
        NewsItem(
          id: 'news-8',
          title: 'Campus hiring drive by a leading product company next week',
          category: NewsCategory.placements,
          publishedAt: _ago(7),
          source: 'Training & Placement Cell',
          summary:
              'An online assessment will be held on campus for eligible pre-final year students.',
          body:
              'An on-campus internship hiring drive will be conducted next week. Eligible students must have a CGPA of 7.5 or above with no active backlogs. The process consists of an online assessment followed by two technical interviews and an HR discussion. Registration closes 48 hours before the assessment.',
          quickSummary: const QuickSummary(
            what: 'On-campus internship hiring drive',
            who: 'Pre-final year students, CGPA 7.5+, no backlogs',
            deadline: 'Registration closes 48 hours before assessment',
            action: 'Register on the placement portal',
          ),
          isImportant: true,
        ),
        NewsItem(
          id: 'news-9',
          title: 'Library adds access to IEEE and Springer full-text archives',
          category: NewsCategory.official,
          publishedAt: _ago(9),
          source: 'Central Library',
          summary:
              'Students can now access full-text papers on campus network and through remote login.',
          body:
              'The Central Library has renewed and expanded its digital subscriptions. Full-text access to IEEE Xplore and Springer Link is available on the campus network. Remote access credentials can be requested at the library help desk with a valid institute identity card.',
        ),
        NewsItem(
          id: 'news-10',
          title: 'Student societies open recruitment for the new session',
          category: NewsCategory.studentUpdates,
          publishedAt: _ago(11),
          source: 'Student Activity Centre',
          summary:
              'Technical, cultural and entrepreneurship societies have opened applications for first and second year students.',
          body:
              'Over twenty student societies have opened recruitment for the new academic session. Applications typically involve a written form followed by a task round and interview. Students are advised to apply to a small number of societies they can commit time to rather than applying broadly.',
        ),
      ];
}
