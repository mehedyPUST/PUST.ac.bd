import test from 'node:test';
import assert from 'node:assert/strict';
import {
  clampMapPercent,
  DEFAULT_ABOUT_EXTRAS,
  DEFAULT_ACADEMIC_EXTRAS,
  DEFAULT_ADMIN_SHOWCASE,
  DEFAULT_ADMISSIONS_CONFIG,
  DEFAULT_CAMPUS_BUILDINGS,
  DEFAULT_CAMPUS_MAP_META,
  DEFAULT_FACILITIES_CONFIG,
  DEFAULT_FOOTER_CONFIG,
  DEFAULT_GOVERNANCE_CONTENT,
  DEFAULT_INSTITUTIONAL_LINKS,
  DEFAULT_NAVBAR_TAGLINE,
  DEFAULT_UPCOMING_SEMINARS,
  DEFAULT_VERIFY_PAGE_CONFIG,
  formatFooterDescription,
  moveArrayItem,
  resolveContextualEditTarget,
  resolveUniversityContent,
} from './cmsDefaults';

test('resolveUniversityContent falls back to all institutional defaults when profile is null', () => {
  const resolved = resolveUniversityContent(null);
  assert.equal(resolved.navbarTagline, DEFAULT_NAVBAR_TAGLINE);
  assert.equal(resolved.institutionalLinks.length, DEFAULT_INSTITUTIONAL_LINKS.length);
  assert.equal(resolved.upcomingSeminars.length, DEFAULT_UPCOMING_SEMINARS.length);
  assert.equal(resolved.campusMapMeta.title, DEFAULT_CAMPUS_MAP_META.title);
  assert.equal(resolved.campusBuildings.length, DEFAULT_CAMPUS_BUILDINGS.length);
  assert.equal(resolved.governanceContent.regentBoardMembers.length, DEFAULT_GOVERNANCE_CONTENT.regentBoardMembers.length);
  assert.equal(resolved.adminShowcase.apaBenchmarks.length, DEFAULT_ADMIN_SHOWCASE.apaBenchmarks.length);
  assert.equal(resolved.aboutExtras.milestones.length, DEFAULT_ABOUT_EXTRAS.milestones.length);
  assert.equal(resolved.academicExtras.facultyDeans.length, DEFAULT_ACADEMIC_EXTRAS.facultyDeans.length);
  assert.equal(resolved.admissionsConfig.gstUnits.length, DEFAULT_ADMISSIONS_CONFIG.gstUnits.length);
  assert.equal(resolved.facilitiesConfig.length, DEFAULT_FACILITIES_CONFIG.length);
  assert.equal(resolved.verifyPageConfig.sampleSerials.length, DEFAULT_VERIFY_PAGE_CONFIG.sampleSerials.length);
  assert.equal(resolved.footerConfig.quickLinks.length, DEFAULT_FOOTER_CONFIG.quickLinks.length);
});

test('resolveUniversityContent preserves partial nested overrides without erasing sibling fields', () => {
  const resolved = resolveUniversityContent({
    navbarTagline: 'Est. 2008 · Rajapur Campus, Pabna',
    governanceContent: {
      ...DEFAULT_GOVERNANCE_CONTENT,
      actIntro: 'Updated PUST Act statutory summary.',
    },
    footerConfig: {
      ...DEFAULT_FOOTER_CONFIG,
      tagline: 'Custom Footer Tagline',
    },
  });

  assert.equal(resolved.navbarTagline, 'Est. 2008 · Rajapur Campus, Pabna');
  assert.equal(resolved.governanceContent.actIntro, 'Updated PUST Act statutory summary.');
  assert.equal(
    resolved.governanceContent.gradingScale.length,
    DEFAULT_GOVERNANCE_CONTENT.gradingScale.length
  );
  assert.equal(resolved.footerConfig.tagline, 'Custom Footer Tagline');
  assert.equal(resolved.footerConfig.contacts.length, DEFAULT_FOOTER_CONFIG.contacts.length);
});

test('formatFooterDescription replaces dynamic faculty and department count placeholders', () => {
  const formatted = formatFooterDescription(
    'Advancing research across {facultiesCount} faculties and {departmentsCount} departments.',
    6,
    24
  );
  assert.equal(formatted, 'Advancing research across 6 faculties and 24 departments.');
});

test('clampMapPercent constrains coordinates safely between 5 and 95', () => {
  assert.equal(clampMapPercent(-10), 5);
  assert.equal(clampMapPercent(120), 95);
  assert.equal(clampMapPercent(47.6), 48);
  assert.equal(clampMapPercent(Number.NaN), 50);
});

test('moveArrayItem reorders elements safely and preserves length', () => {
  const original = ['A', 'B', 'C'];
  assert.deepEqual(moveArrayItem(original, 0, 1), ['B', 'A', 'C']);
  assert.deepEqual(moveArrayItem(original, 2, -1), ['A', 'C', 'B']);
  assert.deepEqual(moveArrayItem(original, 0, -1), ['A', 'B', 'C']);
  assert.deepEqual(moveArrayItem(original, 2, 1), ['A', 'B', 'C']);
});

test('resolveContextualEditTarget maps public routes to accurate contextual editors', () => {
  assert.deepEqual(resolveContextualEditTarget('/verify'), {
    label: 'Edit Verify Page',
    targetKind: 'verify-page',
  });
  assert.deepEqual(resolveContextualEditTarget('/governance/regent-board'), {
    label: 'Edit Governance Section',
    targetKind: 'governance',
  });
  assert.deepEqual(resolveContextualEditTarget('/facilities/library'), {
    label: 'Edit Facility Page',
    targetKind: 'facility',
  });
  assert.deepEqual(resolveContextualEditTarget('/academics/deans'), {
    label: 'Edit Faculty Deans',
    targetKind: 'faculty-deans',
  });
  assert.equal(resolveContextualEditTarget('/portal'), null);
});

test('parseRouteFromPath, getRouteSectionKey, and getBreadcrumbsForPath support sub-pages, department pages, and career', async () => {
  const { parseRouteFromPath, getRouteSectionKey, getBreadcrumbsForPath } = await import('./routes');
  assert.equal(parseRouteFromPath('/academics/departments/phy'), '/academics/departments');
  assert.equal(getRouteSectionKey('/'), 'home');
  assert.equal(getRouteSectionKey('/academics/programs'), 'academics');
  assert.equal(getRouteSectionKey('/academics/faculty'), 'academics');
  assert.equal(getRouteSectionKey('/academics/departments'), 'academics');
  assert.equal(getRouteSectionKey('/academics/departments/CSE'), 'department-detail:cse');
  assert.equal(getRouteSectionKey('/governance/pust-act'), 'governance');
  assert.equal(getRouteSectionKey('/governance/regent-board'), 'governance');
  assert.equal(getRouteSectionKey('/about/our-university'), 'about');
  assert.equal(getRouteSectionKey('/about/history'), 'about');
  assert.equal(getRouteSectionKey('/administration/vc-office'), 'administration');
  assert.equal(getRouteSectionKey('/administration/ict-cell'), 'administration');
  assert.equal(getRouteSectionKey('/career'), '/career');
  assert.deepEqual(getBreadcrumbsForPath('/academics/departments/phy'), [
    { label: 'Home', href: '/' },
    { label: 'Academics', href: '/academics' },
    { label: 'Departments', href: '/academics/departments' },
    { label: 'Department of PHY' },
  ]);
  assert.equal(parseRouteFromPath('/career'), '/career');
  assert.deepEqual(getBreadcrumbsForPath('/career'), [
    { label: 'Home', href: '/' },
    { label: 'Career' },
  ]);
  assert.ok(DEFAULT_FOOTER_CONFIG.quickLinks.some((item) => item.route === '/career'));
});

test('resolveDepartmentImage resolves all 21 department assets, custom URLs, and safe fallbacks', async () => {
  const { existsSync } = await import('node:fs');
  const { join } = await import('node:path');
  const { DEPARTMENT_COVER_IMAGES, resolveDepartmentImage } = await import('./departmentMedia');

  const codes = Object.keys(DEPARTMENT_COVER_IMAGES);
  assert.equal(codes.length, 21);

  for (const code of codes) {
    const url = resolveDepartmentImage({
      code,
      name: code,
      faculty: 'Faculty of Science',
    });
    assert.ok(url.startsWith('/src/assets/images/dept_'), `Expected local dept image for ${code}`);
    const publicPath = join(process.cwd(), 'public', url);
    assert.ok(existsSync(publicPath), `Missing public asset file for ${code}: ${publicPath}`);
  }

  assert.equal(
    resolveDepartmentImage({
      code: 'CSE',
      name: 'Computer Science and Engineering',
      faculty: 'Faculty of Engineering and Technology',
      coverImageUrl: 'https://example.edu/cse-lab.jpg',
    }),
    'https://example.edu/cse-lab.jpg'
  );

  assert.equal(
    resolveDepartmentImage({
      code: 'CSE',
      name: 'Computer Science and Engineering',
      faculty: 'Faculty of Engineering and Technology',
      coverImageUrl: 'javascript:alert(1)',
    }),
    DEPARTMENT_COVER_IMAGES.CSE
  );

  assert.equal(
    resolveDepartmentImage({
      code: 'NEWCHEM',
      name: 'Applied Chemistry & Polymer Science',
      faculty: 'Faculty of Engineering and Technology',
    }),
    DEPARTMENT_COVER_IMAGES.CHEM
  );
});

test('getDepartmentNotices filters case-insensitively and prioritizes pinned and newest circulars', async () => {
  const { getDepartmentNotices } = await import('./departmentNotices');
  const sampleNotices = [
    {
      id: 'n-reg',
      referenceNo: 'PUST/REG/1',
      title: 'Central Notice',
      category: 'General' as const,
      publishedAt: '2026-06-01',
      departmentCode: 'REG',
      boardScope: 'central' as const,
      visibility: 'public' as const,
      summary: 'Central',
      body: 'Central',
      authorName: 'Registrar',
      authorRole: 'admin' as const,
    },
    {
      id: 'n-cse-old',
      referenceNo: 'PUST/CSE/1',
      title: 'Older CSE Notice',
      category: 'Academic' as const,
      publishedAt: '2026-04-10',
      departmentCode: 'cse',
      boardScope: 'department' as const,
      visibility: 'public' as const,
      summary: 'Older CSE',
      body: 'Older CSE',
      pinned: false,
      authorName: 'Chairman',
      authorRole: 'chairman' as const,
    },
    {
      id: 'n-cse-pinned',
      referenceNo: 'PUST/CSE/2',
      title: 'Pinned CSE Notice',
      category: 'Examination' as const,
      publishedAt: '2026-03-15',
      departmentCode: 'CSE',
      boardScope: 'department' as const,
      visibility: 'registered' as const,
      summary: 'Pinned CSE',
      body: 'Pinned CSE',
      pinned: true,
      authorName: 'Chairman',
      authorRole: 'chairman' as const,
    },
    {
      id: 'n-cse-new',
      referenceNo: 'PUST/CSE/3',
      title: 'Newest CSE Notice',
      category: 'Course' as const,
      publishedAt: '2026-05-20',
      departmentCode: 'CSE',
      boardScope: 'course' as const,
      visibility: 'public' as const,
      summary: 'Newest CSE',
      body: 'Newest CSE',
      pinned: false,
      authorName: 'Chairman',
      authorRole: 'chairman' as const,
    },
  ];

  const cse = getDepartmentNotices(sampleNotices, 'CSE');
  assert.deepEqual(
    cse.map((n) => n.id),
    ['n-cse-pinned', 'n-cse-new', 'n-cse-old']
  );
  assert.deepEqual(getDepartmentNotices(sampleNotices, 'eee'), []);
  assert.deepEqual(getDepartmentNotices(sampleNotices, ''), []);
});

test('all 33 administration office routes validate, generate breadcrumbs, and resolve from cmsDefaults', async () => {
  const { DEFAULT_ADMIN_OFFICES } = await import('./adminOffices');
  const { isValidSectionSlug, getBreadcrumbsForPath, parseRouteFromPath } = await import('./routes');

  assert.equal(DEFAULT_ADMIN_OFFICES.length, 33);
  const resolved = resolveUniversityContent(null);
  assert.equal(resolved.adminOffices.length, 33);

  for (const office of DEFAULT_ADMIN_OFFICES) {
    assert.ok(
      isValidSectionSlug('administration', office.slug),
      `Expected valid administration slug: ${office.slug}`
    );
    assert.equal(parseRouteFromPath(office.route), office.route);
    const crumbs = getBreadcrumbsForPath(office.route);
    assert.equal(crumbs.length, 3);
    assert.equal(crumbs[0].label, 'Home');
    assert.equal(crumbs[1].label, 'Administration');
  }

  const ict = resolved.adminOffices.find((o) => o.slug === 'ict-cell');
  assert.ok(ict);
  assert.equal(ict.head?.name, 'Dr. Md. Abdur Rahim');
  assert.equal(ict.officers.length, 5);
});
