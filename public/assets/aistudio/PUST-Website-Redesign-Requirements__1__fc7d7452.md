# PUST Website Redesign -- Complete Requirements

**Project:** Pabna University of Science and Technology (PUST) Official
Website Redesign\
**Reference website:** https://pust.ac.bd/

This document consolidates the requirements collected so far. It
preserves the requested features and workflows. Additional technical
suggestions are identified as implementation considerations rather than
confirmed business requirements.

------------------------------------------------------------------------

## 1. User Accounts & Role-Based Access Management

### Account types

-   Every university officer and office will have a separate account.
-   Students, teachers, and Department Chairmen will each have
    individual accounts.

### Approval hierarchy

  Account               Approval authority
  --------------------- -----------------------------------------
  Registrar Office      Admin Office
  Vice-Chancellor       Admin Office
  Department Chairman   Admin Office
  Teacher               Respective Department Chairman's Office
  Student               Respective Department Chairman's Office

Admin Office requires an initial administrative setup.

### Department notice board

-   Department Chairmen and teachers can publish notices on their
    respective Department Notice Board.
-   Users can act only within their assigned roles and permissions.

### Student portal registration

1.  When a student is admitted, the system generates a unique portal
    signup token.
2.  The token can be delivered by email or mobile phone, or collected
    from the Chairman's Office.
3.  The student uses the token to sign up to the university portal.
4.  During signup, the student submits all required admission documents.
5.  The application goes to the respective Department Chairman's
    dashboard.
6.  The Chairman reviews the application and documents.
7.  After approval, the student can log in and use authorized portal
    services.

## 2. Central Administration & University Authority Accounts

Separate accounts and dashboards will be provided for: - Admin Office -
Registrar Office - Vice-Chancellor

Admin Office approves Registrar Office and Vice-Chancellor accounts.
Each account has permissions appropriate to its responsibilities.

## 3. Specialized Offices & Student Database Access

Separate accounts will be provided for: - Proctor's Office - Library
Office - Hall Office

These offices can access student information across the university,
subject to their permissions. They can filter student records by: -
Department - Academic Session

Filters must be combinable (for example, CSE + Session 2022--23).

## 4. Library Membership & Digital Library Card Management

### Membership application workflow

1.  After the student's portal account is approved, the student can
    apply for library membership.
2.  The application first goes to the Department Chairman's dashboard.
3.  The Chairman reviews it and forwards it to the Library Office.
4.  The forwarded application must include the Chairman's official seal
    and signature.
5.  Seal and signature information is stored in the database in JSON
    format.
6.  The Library Office reviews and confirms the application.

### Library cards

-   After confirmation, the system creates a Digital Library Card.
-   The student can access the digital card through the portal.
-   The Library Office can also issue a physical card.
-   The physical card has a reference number linked to the digital card.

### Library records

Store membership details, book borrowing and return records, borrowing
history, and other library activities. Authorized personnel can view
student library information as permitted.

## 5. Residential Hall Management System

### Hall accounts

-   The university may have multiple residential halls.
-   Multiple Provost accounts may exist, each associated with its
    respective hall.
-   Hall Officers have separate accounts and appropriate permissions.
-   Each hall manages its own vacancies, applications, allotments, and
    student history.

### Vacancy and applications

-   Hall authorities can publish vacancy circulars.
-   Students can apply for hall seats directly through the website.

### Application review

Provosts or authorized Hall Officers can view relevant student records,
including: - Academic records - Student profile and other university
records - Records added by the Department Chairman - Records added by
the Admin Office

Applications can be accepted or rejected with a note.

### Seat allotment

-   After acceptance, the seat is assigned through the hall allotment
    process.
-   Hall Office and Provost can allot, change, or reassign seat numbers.
-   Current and previous seat assignments and the complete seat-change
    history are retained.

### Hall records

Store vacancy circulars, applications, reviews, decisions, notes, seat
allotments, current and previous seat assignments, seat-change history,
and other hall activities.

## 6. Examination Form Fill-up Management

-   During examination periods, the Department Chairman/Department
    Office and Admin Office can publish form fill-up circulars.
-   Students can apply for upcoming examinations within the circular's
    permitted period.
-   Students can enter required information and select courses and
    credits.
-   Available courses are assigned in advance by the Department Chairman
    and Admin Office.
-   Students can select only courses assigned to or eligible for them;
    arbitrary course selection is not allowed.
-   Course and credit information follows predefined academic records.
-   Store each submission and its selected courses against the relevant
    examination/circular.

## 7. Examination Fee Payment & Transaction Management

### Payment methods

Students can pay applicable examination fees using configured methods
such as: - SSLCommerz - Bangla QR - MFS - Other supported payment
systems

### Configuration

-   Admin Office can configure payment systems.
-   Admin Office can enable or disable payment methods and add other
    methods.

### Reference and transaction records

-   After form submission, the system generates a unique reference
    number.
-   The student can use the reference code to pay through MFS.
-   The payment reference links the payment to the student's examination
    form.

Store student, examination, form reference, applicable fee, payment
method, transaction/reference ID, amount, payment status, and date/time.

## 8. Examination Application Verification & Admit Card

-   After submission, the examination application is verified by the
    Department Chairman or Head of the Examination Committee.
-   After successful approval, an Admit Card is generated/issued.
-   The student can download the Admit Card from the portal or collect a
    physical copy from the Department Office.

**Implementation consideration:** Link payment verification to Admit
Card issuance where required by university policy.

## 9. Examination Results, Semester Promotion & Publication

### Result entry and calculation

-   After examinations, the Examination Committee enters each student's
    results.
-   The system automatically calculates results using preset conditions.

### Semester progression

Promotion to the next semester can be: - Determined automatically based
on result rules; or - Decided manually by the Department Chairman and
Admin Office.

### Result publication and access

-   Results are published on the Department Notice Board and Central
    Notice Board.
-   Only registered students and authorized personnel with access can
    view results.

### Session-based notices and notifications

The Chairman's Office can target: - Students from all sessions in the
department; or - Students from a specific academic session.

Push notifications may be sent to the relevant students' devices when
session-targeted notices are published.

## 10. Teacher-Based Course & Session Notice Management

-   Teachers can publish notices for students enrolled in their assigned
    courses and a selected academic session.
-   The teacher selects the relevant course and session.
-   Only students enrolled in that course and session receive the notice
    on their dashboards.
-   Push notifications may be sent to the targeted students' devices.
-   Teachers are restricted to their assigned courses and sessions.

## 11. Hall Financial Clearance for Examination Applications

-   The examination application system checks the student's Hall account
    and outstanding dues.
-   Hall Office maintains Hall-related payments and outstanding dues.
-   If any relevant Hall dues are outstanding, the student cannot apply
    for the examination.
-   If all relevant Hall dues are cleared, the student can proceed.
-   Hall Office updates payment and clearance status.
-   The examination system automatically checks this status.

Hall dues are separate from examination fees.

## 12. Hall Fee Payment & Clearance Generation

-   When a student pays a Hall fee, the Hall Office verifies and
    confirms that payment.
-   The Hall Office generates a clearance for that specific payment
    instance.
-   Each clearance is linked to its corresponding payment record and has
    a unique reference number.
-   Previous payment and clearance records are retained.
-   The examination system checks Hall dues and clearance records.

Suggested clearance data includes student ID, Hall ID, payment
reference, amount, payment date, clearance reference, issue date,
issuing Hall Office, and status.

## 13. Certificate Application & Multi-Office Clearance

### Eligibility

A student can apply for a certificate after completing all semesters and
courses and after all results have been published.

### Independent office review

The application is sent independently to four offices: 1. Department
Chairman's Office 2. Hall Office 3. Library Office 4. Proctor's Office

Each office reviews relevant records:

  -----------------------------------------------------------------------
  Office                              Review responsibility
  ----------------------------------- -----------------------------------
  Department Chairman's Office        Academic and department-related
                                      issues

  Hall Office                         Hall dues, seat records, and
                                      Hall-related issues

  Library Office                      Borrowed books, library dues, and
                                      library issues

  Proctor's Office                    Disciplinary records and offences
  -----------------------------------------------------------------------

### Decisions and resubmission

-   Each office can independently approve or decline the application and
    provide a written note/reason.
-   If declined, the office can ask the student to resolve an issue and
    obtain clearance.
-   The student sees the reason/instructions on the dashboard, resolves
    the issue, and resubmits.
-   The relevant office reviews the resubmission.
-   Preserve previous decisions, notes, clearances, and resubmission
    history.
-   Final certificate processing is blocked until all four offices
    provide clearance.

## 14. Certificate Application Fee & Issuance

### Application fee

-   The student pays the applicable Certificate Application Fee when
    applying.
-   Admin Office configures the fee.
-   Payment can use university-configured methods such as SSLCommerz,
    Bangla QR, MFS, or other supported systems.
-   Certificate fees are separate from Hall fees and examination fees.

### Final approval and temporary certificate

1.  After all four offices clear the application, it goes to the Admin
    Office.
2.  Admin Office performs the final check and approves it.
3.  After approval, the system generates a Temporary Certificate.
4.  The student can download it from the portal or collect a physical
    copy from the Admin Office.

Store the application, payment and transaction details, office
clearances, rejection/resubmission history, final approval, certificate
serial/reference, generation and issue dates, and download/physical
collection records.

## 15. Central University Notice Board Management

-   Admin Office can publish notices directly to the Central Notice
    Board.
-   Relevant university offices with permission can also publish central
    notices.
-   Publishing access is controlled by role-based permissions.

Store publisher/office, title, content, publication date, attachments,
and target audience.

## 16. Homepage Gallery -- Photos & Videos

-   The homepage includes a dedicated section or directory named
    **Gallery**.
-   It displays university festival, occasional-event, and other
    important/necessary photos and videos.
-   Gallery content may include cultural programs, academic events,
    celebrations, and other noteworthy university media.

Suggested content metadata includes title, description, category, date,
and media.

## 17. Notice Visibility & Audience Control

When publishing a notice, Admin can choose its visibility:

### Public View

Anyone visiting the website can view the notice without logging in.

### Registered Users

Only logged-in and authorized portal users can view the notice.

The backend must enforce access restrictions; hiding a notice only in
the frontend is insufficient.

## 18. About the University -- Content Management

-   The homepage includes an About section.
-   It displays information about the university, its history, and
    related topics.
-   Admins can add and manage this content.

The section can include Our University, History, Mission, Vision, Plans,
and other university-related topics.

## 19. Vice-Chancellor Profile & Public Message

### Current Vice-Chancellor

The homepage has a dedicated section displaying: - Current
Vice-Chancellor's details - Public message

The Admin Office manages and updates the current profile and message.
When a new Vice-Chancellor takes office, the new profile becomes the
current profile.

### Previous Vice-Chancellors

-   Profiles of previous Vice-Chancellors are retained in an archive.
-   Visitors can browse the archive.
-   Admin Office manages the archived profiles.
-   When a new Vice-Chancellor takes office, the former current profile
    moves to the archive.

### User-controlled visibility

-   Previous Vice-Chancellors' profiles are not all displayed directly
    by default.
-   A **Previous Vice-Chancellors** button, link, or expandable section
    is provided.
-   The archive becomes visible when a visitor takes action, such as
    clicking the link.
-   The current Vice-Chancellor's profile remains visible on the
    homepage.

## 20. Main Navigation Bar (Navbar) & Dropdown Menus

The navbar contains the following main categories and links.

### About

-   Our University
-   History
-   Mission and Plans

### Administration

-   [Vice-Chancellor
    Office](https://pust.ac.bd/administration/Vice-Chancellor-Office)
-   [Pro Vice-Chancellor
    Office](https://pust.ac.bd/administration/Pro-Vice-Chancellor-Office)
-   [Treasurer
    Office](https://pust.ac.bd/administration/Treasurer-Office)
-   [Registrar
    Office](https://pust.ac.bd/administration/Registrar-Office)
-   [Proctor Office](https://pust.ac.bd/administration/Proctor-Office)
-   [Student Advisor
    Office](https://pust.ac.bd/administration/Student-Advisor-Office)
-   [ICT Cell](https://pust.ac.bd/administration/ICT-Cell)
-   [All Office](https://pust.ac.bd/administration/All-Office)
-   [APA](https://pust.ac.bd/administration/APA)

### Academic

-   [Academic Programs](https://pust.ac.bd/academic/academic_program)
-   [Faculty](https://pust.ac.bd/academic/faculties)
-   [Departments](https://pust.ac.bd/academic/departments)
-   [Forms Download](https://pust.ac.bd/academic/form_download)
-   [Academic Calendar](https://pust.ac.bd/academic/academic_calender)
-   [Scholarship](https://pust.ac.bd/academic/Scholarship)
-   [Seminars & Workshops](https://pust.ac.bd/academic/workshops)
-   [All Dean](https://pust.ac.bd/academic/all_dean)
-   [All Chairman](https://pust.ac.bd/academic/all_chairman)
-   [PUST Journals](https://pust.ac.bd/academic/pust-journals)
-   [Publications](https://pust.ac.bd/academic/publications)

### Admission

-   [Undergraduate](https://pust.ac.bd/admission/undergraduate)
-   [Graduate](https://pust.ac.bd/admission/graduate)
-   [Evening Programs](https://pust.ac.bd/admission/Evening_Programs)
-   [Admission Notice](https://pust.ac.bd/admission)

### Faculties / Facilities

The requested navbar label is **Faculties**; the listed links are
university facilities: -
[Library](https://pust.ac.bd/facilities/library) -
[Transport](https://pust.ac.bd/facilities/transportation) -
[Residence](https://pust.ac.bd/facilities/residence) -
[Medical](https://pust.ac.bd/facilities/medical) - [ICT
Sheba](https://pust.ac.bd/facilities/ICT-Cell-Sheba)

Main categories appear in the navbar, with their relevant links
organized under dropdown menus.

## 21. Professional & Well-Organized Website Footer

The website has a logical, modern, responsive footer with clearly
grouped information and quick navigation.

Suggested sections: - **About PUST:** University introduction, history,
mission, and vision. - **Quick Links:** Important pages and frequently
used services. - **Administration:** Important university offices. -
**Academic:** Faculties, departments, academic programs, and academic
calendar. - **Student Services:** Student portal, library, residence,
admission, and examination services. - **Contact Information:**
University address, phone, email, and location. - **Social Media:**
Official university social media links. - **Copyright:** Copyright
notice and website ownership information.

The footer should be easy to navigate and consistent with the overall
website design.

------------------------------------------------------------------------

## 22. Technical & System-Wide Implementation Considerations

These are implementation recommendations supporting the requirements
above, not additional confirmed business rules.

### Role-based access control

Implement role- and permission-based access for Admin, Registrar,
Vice-Chancellor, Pro Vice-Chancellor, Treasurer, Department Chairman,
Teacher, Student, Proctor's Office, Library Office, Hall Office, and
other authorized officers.

### Centralized student database

Maintain a consistent student record containing relevant personal,
admission, department/session, academic, examination, result, library,
Hall, financial-clearance, certificate, and disciplinary information.
Each office should access only the information permitted for its role.

### Activity and audit history

Record important actions, including approvals/rejections, student-data
changes, seat changes, payment verification, notice publication, and
certificate issuance. Store who performed the action and when.

### Notifications

Consider email, SMS, push notifications, and in-app notifications for
relevant workflows.

### Security and data integrity

Consider secure authentication, backend authorization, secure document
storage, payment verification, backups and recovery, and audit logs.

## 23. Major System Modules

1.  User and Account Management
2.  Central Administration
3.  Student Database
4.  Library Management
5.  Hall Management
6.  Examination Management
7.  Examination Payments
8.  Admit Card Management
9.  Result Management
10. Department Notices
11. Hall Financial Clearance
12. Hall Payment and Clearance
13. Certificate Clearance
14. Certificate Management
15. Central Notice Board
16. Homepage Gallery
17. Notice Visibility and Access
18. About PUST Content Management
19. Vice-Chancellor Profiles and Archive
20. Navbar and Navigation
21. Website Footer

## 24. Key End-to-End Workflows

### A. Student registration

Admission completed → unique signup token generated → student submits
signup and documents → Department Chairman reviews → approval → student
portal access enabled.

### B. Library membership

Student applies → Chairman reviews → Chairman forwards with official
seal/signature → Library Office verifies and approves → digital card
generated → physical card may be issued.

### C. Examination application

Examination circular published → student selects eligible courses →
system checks Hall dues → student submits form and completes applicable
payment process → application reference generated → Chairman/Examination
Committee verifies → Admit Card issued after approval.

### D. Certificate application

Student completes all semesters and courses and all results are
published → student submits certificate application and fee → four
offices independently review → student resolves any declined issues and
resubmits as needed → all four clearances completed → Admin Office final
verification and approval → Temporary Certificate generated → student
downloads or collects it.

## 25. Decisions to Finalize Before Development

The following details should be clarified during detailed planning:

1.  Initial Admin account setup and account-creation process for other
    authorities.
2.  Signup token validity, expiration, resend, and one-time-use rules.
3.  Payment gateway integration, failed transactions, refunds, and
    reconciliation.
4.  Course eligibility, credit rules, grading system, and
    semester-promotion conditions.
5.  Hall capacity, vacancy calculation, fee categories, and
    seat-allotment rules.
6.  Temporary Certificate format, serial number, and verification
    method.
7.  Email, SMS, and push-notification providers and delivery rules.
8.  Which website content is public and which requires login.
9.  Migration of existing PUST pages, documents, information, and media.
10. Mobile, tablet, and desktop responsiveness across the public website
    and dashboards.

------------------------------------------------------------------------

## Project Scope Summary

This project is more than a public university website redesign. It is
intended to become an integrated digital university platform for PUST,
combining:

-   A modern public-facing university website
-   Centralized student information
-   Digitized administrative workflows
-   Department- and office-based management
-   Online student services
-   Academic and examination management
-   Library and residential Hall management
-   Certificate clearance and issuance
-   Secure role-based access and record history

**End of requirements document.**
