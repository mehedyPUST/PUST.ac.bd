import assert from 'node:assert/strict';
import test from 'node:test';
import { buildPersonVCard, escapeVCardValue, getVCardFilename } from './vcard';

test('escapeVCardValue escapes semicolons, commas, backslashes, and newlines', () => {
  assert.equal(escapeVCardValue('A; B, C\\D\nLine2'), 'A\\; B\\, C\\\\D\\nLine2');
});

test('buildPersonVCard generates valid vCard 3.0 with profile URL and contact fields', () => {
  const vcard = buildPersonVCard({
    person: {
      id: 'prof-rahman',
      name: 'Prof. Dr. Md. Rahman',
      designation: 'Professor & Chairman',
      officeLocation: 'Room 302, Academic Building 2',
      qualification: 'Ph.D. (BUET), M.Sc.',
      researchArea: 'Power Systems; Smart Grid',
      phones: [
        { value: '+880 1711-000001 (Office)', type: 'Office' },
        { value: '+880 1811-000002', type: 'Personal' },
      ],
      emails: [{ value: 'rahman@pust.ac.bd', type: 'Office' }],
    },
    department: {
      code: 'EEE',
      name: 'Electrical and Electronic Engineering',
      building: 'Academic Building 2',
    },
    profileUrl: 'https://pust.ac.bd/academics/departments/eee/people/prof-rahman',
  });

  assert.match(vcard, /^BEGIN:VCARD\r\nVERSION:3\.0\r\n/);
  assert.match(vcard, /FN:Prof\. Dr\. Md\. Rahman/);
  assert.match(vcard, /N:;Rahman;;Prof\. Dr\. Md\.;/);
  assert.match(
    vcard,
    /ORG:Pabna University of Science and Technology \(PUST\);Department of Electrical and Electronic Engineering/
  );
  assert.match(vcard, /TITLE:Professor & Chairman/);
  assert.match(vcard, /TEL;TYPE=WORK,VOICE:\+8801711000001/);
  assert.match(vcard, /TEL;TYPE=CELL:\+8801811000002/);
  assert.match(vcard, /EMAIL;TYPE=INTERNET,WORK:rahman@pust\.ac\.bd/);
  assert.match(vcard, /ADR;TYPE=WORK:;;Room 302\\, Academic Building 2;Rajapur;Pabna;6600;Bangladesh/);
  assert.match(vcard, /URL:https:\/\/pust\.ac\.bd\/academics\/departments\/eee\/people\/prof-rahman/);
  assert.match(vcard, /NOTE:Qualification: Ph\.D\. \(BUET\)\\, M\.Sc\. \| Research Area: Power Systems\\; Smart Grid/);
  assert.match(vcard, /\r\nEND:VCARD$/);
});

test('buildPersonVCard compact mode uses newline separators and omits NOTE for clean QR scanning', () => {
  const compact = buildPersonVCard({
    person: {
      id: 'fac-1',
      name: 'Dr. Taslima Akter',
      designation: 'Associate Professor',
      qualification: 'Ph.D.',
      phones: [{ value: '+8801700000000', type: 'Office' }],
      emails: [{ value: 'taslima@pust.ac.bd', type: 'Office' }],
    },
    department: {
      code: 'CSE',
      name: 'Computer Science and Engineering',
      building: 'Engineering Building',
    },
    profileUrl: 'https://pust.ac.bd/academics/departments/cse/people/fac-1',
    compact: true,
  });

  assert.equal(compact.includes('\r\n'), false);
  assert.equal(compact.includes('NOTE:'), false);
  assert.match(compact, /^BEGIN:VCARD\nVERSION:3\.0\n/);
});

test('getVCardFilename builds clean filesystem-safe .vcf filename', () => {
  assert.equal(
    getVCardFilename('Prof. Dr. Md. Abul Kashem', 'CSE'),
    'prof-dr-md-abul-kashem-cse.vcf'
  );
});
