# NSUT Hub Navigator

Build a production-quality Flutter mobile application called NSUT Hub for students of Netaji Subhas University of Technology (NSUT), Delhi.

This must be a proper native-feeling mobile application built with Flutter and Dart, designed for Android first but structured so it can also support iOS later.

Do NOT build this as a web app.

PRODUCT VISION

NSUT already has apps/features covering things like attendance, timetable, profile, results, notices and other basic academic functionality.

Therefore, do not make attendance/timetable the core purpose of this app.

NSUT Hub should instead be a student discovery platform:

Discover → Save → Track → Participate

The app should bring together useful opportunities and information for NSUT students from both inside and outside the university.

The core content should include:

NSUT News

NSUT events

Hackathons

External hackathons

Internships

Research opportunities

Scholarships

Fellowships

Competitions

Open-source programs

Academic resources

Useful student tools

Important deadlines

The most important interaction is:

Save anything interesting → track it → receive optional reminders → open/apply later.

TECH STACK

Use:

Flutter

Dart

Material 3

Clean architecture / feature-based architecture

Riverpod or Bloc for state management

GoRouter for navigation

Firebase Authentication

Firebase Cloud Messaging for notifications

Firebase Storage for uploaded resources/images

REST API-ready architecture

PostgreSQL-ready backend architecture

Keep the data layer abstract enough that the frontend can initially use mock JSON/local data and later connect to a real backend API without rewriting the UI.

DESIGN LANGUAGE

Create a premium modern student-tech UI.

The app should feel like:

Linear + Notion + modern startup app + NSUT identity

Avoid the typical outdated college portal design.

Use:

Dark navy / deep blue base

Blue/cyan accent

White/light text

Subtle borders

Rounded cards

Clean typography

Minimal shadows

Small micro-interactions

Smooth transitions

Clear hierarchy

Modern icons

Do NOT overuse:

gradients

glassmorphism

excessive animations

giant illustrations

The UI should be information-rich but not cluttered.

Make everything responsive to different phone sizes.

APP STRUCTURE

Bottom navigation:

Home

Discover

Saved

Tools

Profile

Use a clean floating/modern bottom navigation bar.

1. HOME

The Home screen should be personalized.

Header:

“Good evening, Mayank 👋”

Subtitle:

“Here’s what’s worth checking out.”

Then:

Upcoming Deadlines

Show saved opportunities with approaching deadlines.

Example:

Upcoming Deadlines

🔴 Today
Smart India Hackathon

🟠 3 days
Research Internship

🟡 6 days
Scholarship Application

Recommended For You

Show opportunities based on:

branch

year

selected interests

saved items

categories the user frequently views

Example:

“Because you saved AI & Web Development opportunities”

Trending

Show currently popular opportunities/hackathons.

NSUT News

Show 2–3 important recent updates.

Quick Tools

Cards:

CGPA
SGPA
CGPA Predictor

Recently Saved

Show the user’s recently saved items.

2. DISCOVER

This should be the primary discovery feed.

Header:

“Discover”

Large search bar:

“Search hackathons, internships, scholarships…”

Categories:

All
Hackathons
Internships
Research
Scholarships
Competitions
Fellowships
Open Source

Filters:

Online
Offline
Delhi
India
International

Sort:

Recommended
Deadline Soon
Newest
Popular

Every card should have:

title

organization

category

deadline

location/mode

prize/stipend if applicable

relevant tags

eligibility

Save button

View button

Use a clean card design optimized for mobile.

3. HACKATHONS

Create a dedicated hackathon discovery page.

Include:

NSUT hackathons

Delhi/NCR hackathons

Indian college hackathons

National hackathons

International/open hackathons

Potential data sources can later be integrated through official APIs or compliant scraping where permitted.

Hackathon card:

CodeStorm 2026

₹2,00,000 Prize Pool

Online
Team: 2–4

AI · Web · Open Innovation

Registration closes in 4 days

[Save]    [View]

Filters:

Domain

Mode

Location

Prize

Team size

Deadline

Beginner friendly

Sections:

Closing Soon

Popular

New

Recommended

4. OPPORTUNITIES

Separate hackathons from other opportunities.

Categories:

Internships

Research

Scholarships

Fellowships

Competitions

Open Source

Programs

Opportunity cards should follow the same visual language.

5. OPPORTUNITY DETAILS

Create a detailed mobile page.

Show:

Title
Organization
Category
Deadline
Location
Mode
Eligibility
Duration
Prize/Stipend
Skills
Tags

Then sections:

About

Eligibility

Timeline

Requirements

Primary button:

Apply Now

Secondary:

Save Opportunity

Also show a highly visible:

Deadline in 4 days

If the user saves the opportunity, allow:

Set Reminder

6. SAVE SYSTEM

This is one of the most important features.

Every opportunity/news/resource should have a bookmark/save button.

The user can save:

Hackathons

Internships

Research

Scholarships

News

Resources

Create a dedicated:

Saved

screen.

Tabs:

All
Hackathons
Internships
Research
Scholarships
Resources
News

Allow users to create custom collections:

Examples:

Apply This Week

Research

Summer Internships

Important

Competitions

Users should be able to:

save

unsave

move to collection

set reminder

open item

Saving should have a small satisfying animation and immediate UI update.

7. DEADLINE TRACKER

Create a dedicated deadline view.

Show:

THIS WEEK

🔴 Today
Smart India Hackathon

🟠 Tomorrow
Research Internship

🟡 4 days
Scholarship

🟢 6 days
Open Source Program

For every saved opportunity:

Allow:

reminder 1 day before

reminder 3 days before

custom reminder

no reminder

Use Firebase Cloud Messaging for future push notification integration.

8. NSUT NEWS

Create a dedicated NSUT news section.

Categories:

Official

Academics

Placements

Research

Scholarships

Sports

Achievements

Student Updates

Each item:

Title
Category
Date
Source
Summary
Save
Read More

For long official notices, add:

Quick Summary

The backend/AI layer should eventually extract:

What is this?

Who is eligible?

Deadline

What action is required?

Make this feel like a useful feature, not an AI gimmick.

9. RESOURCES

Create a student resource library.

Navigation:

Branch
→ Semester
→ Subject

Example:

ECE
→ Semester 5
→ Modern Control Theory

Resources:

Notes

PYQs

Lab Manuals

Books

Cheat Sheets

Assignments

Study Material

Interview Preparation

Each resource card:

Title
Subject
Semester
Uploaded by
File type
Rating/upvotes
Save

Include:

Search
Filters
Most Useful
Recently Added

Eventually allow student-contributed resources with moderation.

10. TOOLS

Create a dedicated Tools screen.

SGPA Calculator

Dynamic subjects:

Subject       Credits       Grade

Subject 1       4            A
Subject 2       3            B+
Subject 3       4            A+

Allow:

Add Subject
Remove Subject

Calculate SGPA instantly.

CGPA Calculator

Input:

Current CGPA
Completed Credits
Remaining Credits

Calculate projected CGPA.

CGPA Predictor

Allow students to enter expected future semester SGPA.

Example:

Current CGPA: 7.82

Future SGPA:
Semester 5 → 8.5
Semester 6 → 9.0
Semester 7 → 8.8
Semester 8 → 9.0

Show projected final CGPA.

Also provide target mode:

“What SGPA do I need to reach 8.5 CGPA?”

Make the result visually clear.

11. GLOBAL SEARCH

Implement a global search experience.

Search across:

Hackathons

Internships

Research

Scholarships

News

Resources

Results should be grouped by category.

Example:

Search:

“AI”

Results:

Hackathons — 12
Internships — 8
Research — 5
Resources — 21

Add recent searches.

12. PERSONALIZATION

Do not force users through a huge onboarding form.

Optional onboarding:

Year
Branch
Interests
Skills

Interests:

AI/ML
Web Development
App Development
Competitive Programming
Research
Robotics
Design
Cybersecurity
Finance

Use these to personalize recommendations.

Also learn from user behavior:

saved items

viewed categories

searches

Example:

If the user repeatedly saves AI hackathons:

Show more AI-related opportunities.

13. PROFILE

Simple profile page.

Show:

Name
Branch
Year
Interests

Stats:

Saved
Tracked
Applied/Opened

Settings:

Notifications
Reminder Preferences
Personalization
Theme
Account

14. NOTIFICATIONS

Create a notification center.

Notification examples:

“SIH registration closes tomorrow.”

“New AI hackathon matching your interests.”

“New NSUT research opportunity.”

“Your saved scholarship deadline is in 3 days.”

Allow notification preferences by category.

15. ADMIN DASHBOARD / BACKEND READY

The Flutter app should be designed to consume backend APIs for:

Users
Opportunities
Hackathons
News
Resources
Saved Items
Collections
Deadlines
Notifications
Categories
Tags

Opportunity model:

id
title
organization
description
category
deadline
location
mode
eligibility
skills
tags
source
applyUrl
createdAt
updatedAt

Support external source URLs.

16. DATA AGGREGATION

The backend should eventually support:

API integrations
Compliant web scraping
Scheduled data ingestion
Data normalization
Duplicate detection
Categorization

If the same hackathon exists on multiple platforms, avoid displaying it as multiple unrelated opportunities.

Keep the original source and registration URL visible.

Respect:

robots.txt

website terms

API policies

rate limits

Prefer official APIs/feeds whenever available.

17. MOBILE UX

This is a mobile application, so prioritize thumb-friendly interaction.

Use:

bottom sheets

swipeable cards where useful

pull-to-refresh

infinite scrolling/pagination

skeleton loading

offline caching where useful

optimistic save actions

deep links to opportunities

external browser/app opening for registration

Avoid desktop-style tables.

18. EMPTY STATES

Create polished empty states.

Example:

No saved items:

“You haven’t saved anything yet.”

“Explore opportunities and bookmark what interests you.”

No deadlines:

“You’re all caught up 🎉”

No resources:

“No resources available yet.”

19. ERROR / LOADING UX

Do not show raw exceptions.

Use:

skeleton loaders

retry buttons

friendly error messages

offline indicators

cached data when available

20. SAMPLE DATA

Populate the initial app with realistic mock data so every screen looks complete.

Include at least:

10 hackathons
10 internships
5 research opportunities
5 scholarships
10 NSUT news items
20 academic resources

Use realistic but clearly mock/demo content where necessary.

21. ANIMATIONS

Keep animations subtle and premium.

Animate:

save/bookmark action

page transitions

filter changes

opening opportunity details

deadline countdown

calculator results

Avoid excessive animation.

22. CODE QUALITY

Use:

reusable widgets

clear folder structure

models

repositories

services

state management

API abstraction

constants/theme files

proper error handling

Do not put all application logic inside UI widgets.

Structure the Flutter project so it can scale into a real production app.

FINAL PRODUCT FEEL

The finished app should NOT look like:

a college management portal

an attendance tracker

a generic CRUD app

a basic Flutter tutorial project

It should feel like a real product that an NSUT student opens every day to answer:

“What’s happening?”

“What opportunities are available?”

“What should I apply for?”

“What did I save?”

“What deadline is coming up?”

The central product loop should always be:

DISCOVER → SAVE → TRACK → APPLY/PARTICIPATE

Brand:

NSUT Hub

Tagline:

Discover. Save. Participate.

Build the first version with polished mock data and a complete working Flutter UI, while keeping the architecture ready for Firebase and a production backend.

This project was built with [Lovable](https://lovable.dev).

## Build with Lovable

Continue developing this project in the [Lovable editor](https://lovable.dev/projects/eb98fb06-7d73-47ba-be5c-b6115cbb928c).

- **Ship faster**: describe what you want to build and Lovable handles the code.
- **Stay in sync**: every change made in Lovable is committed straight to this repository.
- **Full ownership**: this code is yours. Push to `main` on GitHub and your changes sync back into Lovable, ready for your next prompt.

## Development

Prefer working locally? You need Node.js and npm — [install with nvm](https://github.com/nvm-sh/nvm#installing-and-updating).

```sh
git clone <this-repository-url>
cd <repository-name>
npm i
npm run dev
```
