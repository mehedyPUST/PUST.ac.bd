import { MongoClient, ObjectId, type Collection, type Db } from 'mongodb';
import crypto from 'node:crypto';
import type {
  AuthUser,
  BookmarkRecord,
  DepartmentRecord,
  InquiryRecord,
  NoticeCategory,
  NoticeRecord,
  PublicationRecord,
  UniversityProfile,
  UserRole,
} from '../src/types/pust';
import {
  SEED_DEPARTMENTS,
  SEED_NOTICES,
  SEED_PUBLICATIONS,
  SEED_UNIVERSITY_PROFILE,
} from './seedData';

export interface StoredUser extends AuthUser {
  passwordHash: string;
}

interface NoticeDoc {
  _id: ObjectId;
  referenceNo: string;
  title: string;
  category: NoticeCategory;
  publishedAt: string;
  departmentCode: string;
  summary: string;
  body: string;
  pinned?: boolean;
  authorName?: string;
}

interface UserDoc {
  _id: ObjectId;
  name: string;
  email: string;
  passwordHash: string;
  role: UserRole;
  departmentCode: string;
  academicId: string;
  hallAffiliation: string;
  createdAt: string;
}

interface InquiryDoc {
  _id: ObjectId;
  fullName: string;
  email: string;
  phone: string;
  programLevel: InquiryRecord['programLevel'];
  departmentCode: string;
  message: string;
  status: 'Received' | 'Reviewed';
  createdAt: string;
}

interface BookmarkDoc {
  _id: ObjectId;
  userId: string;
  itemType: 'department' | 'notice';
  itemId: string;
  title: string;
  subtitle: string;
  createdAt: string;
}

interface DepartmentDoc extends Omit<DepartmentRecord, 'id'> {
  _id: string;
}

interface PublicationDoc extends Omit<PublicationRecord, 'id'> {
  _id: string;
}

class PustRepository {
  private client: MongoClient | null = null;
  private db: Db | null = null;
  private storageBackend: 'mongodb' | 'memory' = 'memory';

  private memDepartments: DepartmentRecord[] = [...SEED_DEPARTMENTS];
  private memNotices: NoticeRecord[] = [...SEED_NOTICES];
  private memPublications: PublicationRecord[] = [...SEED_PUBLICATIONS];
  private memUsers: StoredUser[] = [];
  private memInquiries: InquiryRecord[] = [];
  private memBookmarks: BookmarkRecord[] = [];

  async init(): Promise<void> {
    const uri = process.env.MONGODB_URI?.trim();
    const dbName = process.env.MONGODB_DB_NAME?.trim() || 'pust_portal';

    if (!uri) {
      this.storageBackend = 'memory';
      return;
    }

    try {
      const client = new MongoClient(uri, {
        serverSelectionTimeoutMS: 5000,
      });
      await client.connect();
      const db = client.db(dbName);
      await db.command({ ping: 1 });

      this.client = client;
      this.db = db;
      this.storageBackend = 'mongodb';

      await this.ensureIndexesAndSeed(db);
    } catch (err) {
      console.warn(
        '[PUST DB] Could not connect to MONGODB_URI; falling back to preview memory store:',
        err instanceof Error ? err.message : String(err)
      );
      this.client = null;
      this.db = null;
      this.storageBackend = 'memory';
    }
  }

  private async ensureIndexesAndSeed(db: Db): Promise<void> {
    const usersCol = db.collection<UserDoc>('users');
    await usersCol.createIndex({ email: 1 }, { unique: true });

    const noticesCol = db.collection<NoticeDoc>('notices');
    await noticesCol.createIndex({ publishedAt: -1 });
    await noticesCol.createIndex({ category: 1 });

    const bookmarksCol = db.collection<BookmarkDoc>('bookmarks');
    await bookmarksCol.createIndex({ userId: 1, itemId: 1 }, { unique: true });

    const deptCol = db.collection<DepartmentDoc>('departments');
    if ((await deptCol.countDocuments()) === 0) {
      await deptCol.insertMany(
        SEED_DEPARTMENTS.map(({ id, ...rest }) => ({
          _id: id,
          ...rest,
        }))
      );
    }

    const pubCol = db.collection<PublicationDoc>('publications');
    if ((await pubCol.countDocuments()) === 0) {
      await pubCol.insertMany(
        SEED_PUBLICATIONS.map(({ id, ...rest }) => ({
          _id: id,
          ...rest,
        }))
      );
    }

    if ((await noticesCol.countDocuments()) === 0) {
      await noticesCol.insertMany(
        SEED_NOTICES.map(({ id: _id, ...rest }) => ({
          _id: new ObjectId(),
          ...rest,
        }))
      );
    }
  }

  getStorageBackend(): 'mongodb' | 'memory' {
    return this.storageBackend;
  }

  getUniversityProfile(): UniversityProfile {
    return SEED_UNIVERSITY_PROFILE;
  }

  private col<T extends object>(name: string): Collection<T> {
    if (!this.db) {
      throw new Error('MongoDB is not active');
    }
    return this.db.collection<T>(name);
  }

  async listDepartments(): Promise<DepartmentRecord[]> {
    if (this.storageBackend === 'mongodb') {
      const docs = await this.col<DepartmentDoc>('departments').find({}).toArray();
      return docs.map(({ _id, ...rest }) => ({ id: _id, ...rest }));
    }
    return [...this.memDepartments];
  }

  async listPublications(): Promise<PublicationRecord[]> {
    if (this.storageBackend === 'mongodb') {
      const docs = await this.col<PublicationDoc>('publications').find({}).toArray();
      return docs.map(({ _id, ...rest }) => ({ id: _id, ...rest }));
    }
    return [...this.memPublications];
  }

  async listNotices(category?: string, search?: string): Promise<NoticeRecord[]> {
    let items: NoticeRecord[];
    if (this.storageBackend === 'mongodb') {
      const filter: Record<string, unknown> = {};
      if (category && category !== 'All') {
        filter.category = category;
      }
      const docs = await this.col<NoticeDoc>('notices')
        .find(filter)
        .sort({ pinned: -1, publishedAt: -1 })
        .toArray();
      items = docs.map((d) => ({
        id: d._id.toHexString(),
        referenceNo: d.referenceNo,
        title: d.title,
        category: d.category,
        publishedAt: d.publishedAt,
        departmentCode: d.departmentCode,
        summary: d.summary,
        body: d.body,
        pinned: Boolean(d.pinned),
        authorName: d.authorName,
      }));
    } else {
      items = [...this.memNotices].sort((a, b) => {
        if (Boolean(a.pinned) !== Boolean(b.pinned)) {
          return a.pinned ? -1 : 1;
        }
        return b.publishedAt.localeCompare(a.publishedAt);
      });
      if (category && category !== 'All') {
        items = items.filter((n) => n.category === category);
      }
    }

    if (search && search.trim().length > 0) {
      const q = search.trim().toLowerCase();
      items = items.filter(
        (n) =>
          n.title.toLowerCase().includes(q) ||
          n.referenceNo.toLowerCase().includes(q) ||
          n.summary.toLowerCase().includes(q) ||
          n.departmentCode.toLowerCase().includes(q)
      );
    }

    return items;
  }

  async createNotice(input: Omit<NoticeRecord, 'id'>): Promise<NoticeRecord> {
    if (this.storageBackend === 'mongodb') {
      const _id = new ObjectId();
      await this.col<NoticeDoc>('notices').insertOne({
        _id,
        ...input,
      });
      return { id: _id.toHexString(), ...input };
    }
    const created: NoticeRecord = {
      id: `notice-${crypto.randomUUID()}`,
      ...input,
    };
    this.memNotices.unshift(created);
    return created;
  }

  async deleteNotice(id: string): Promise<boolean> {
    if (this.storageBackend === 'mongodb') {
      if (!ObjectId.isValid(id)) return false;
      const result = await this.col<NoticeDoc>('notices').deleteOne({
        _id: new ObjectId(id),
      });
      return result.deletedCount === 1;
    }
    const before = this.memNotices.length;
    this.memNotices = this.memNotices.filter((n) => n.id !== id);
    return this.memNotices.length < before;
  }

  async hasAdminUser(): Promise<boolean> {
    if (this.storageBackend === 'mongodb') {
      const count = await this.col<UserDoc>('users').countDocuments({ role: 'admin' });
      return count > 0;
    }
    return this.memUsers.some((u) => u.role === 'admin');
  }

  async findUserByEmail(email: string): Promise<StoredUser | null> {
    const normalized = email.trim().toLowerCase();
    if (this.storageBackend === 'mongodb') {
      const doc = await this.col<UserDoc>('users').findOne({ email: normalized });
      if (!doc) return null;
      return {
        id: doc._id.toHexString(),
        name: doc.name,
        email: doc.email,
        passwordHash: doc.passwordHash,
        role: doc.role,
        departmentCode: doc.departmentCode,
        academicId: doc.academicId,
        hallAffiliation: doc.hallAffiliation,
        createdAt: doc.createdAt,
      };
    }
    return this.memUsers.find((u) => u.email === normalized) ?? null;
  }

  async createUser(input: Omit<StoredUser, 'id' | 'createdAt'>): Promise<StoredUser> {
    const normalizedEmail = input.email.trim().toLowerCase();
    const createdAt = new Date().toISOString();

    if (this.storageBackend === 'mongodb') {
      const _id = new ObjectId();
      await this.col<UserDoc>('users').insertOne({
        _id,
        name: input.name,
        email: normalizedEmail,
        passwordHash: input.passwordHash,
        role: input.role,
        departmentCode: input.departmentCode,
        academicId: input.academicId,
        hallAffiliation: input.hallAffiliation,
        createdAt,
      });
      return {
        id: _id.toHexString(),
        ...input,
        email: normalizedEmail,
        createdAt,
      };
    }

    if (this.memUsers.some((u) => u.email === normalizedEmail)) {
      throw new Error('DUPLICATE_EMAIL');
    }

    const user: StoredUser = {
      id: `user-${crypto.randomUUID()}`,
      ...input,
      email: normalizedEmail,
      createdAt,
    };
    this.memUsers.push(user);
    return user;
  }

  async createInquiry(
    input: Omit<InquiryRecord, 'id' | 'status' | 'createdAt'>
  ): Promise<InquiryRecord> {
    const createdAt = new Date().toISOString();
    const status = 'Received' as const;

    if (this.storageBackend === 'mongodb') {
      const _id = new ObjectId();
      await this.col<InquiryDoc>('inquiries').insertOne({
        _id,
        ...input,
        status,
        createdAt,
      });
      return { id: _id.toHexString(), ...input, status, createdAt };
    }

    const created: InquiryRecord = {
      id: `inq-${crypto.randomUUID()}`,
      ...input,
      status,
      createdAt,
    };
    this.memInquiries.unshift(created);
    return created;
  }

  async listInquiries(): Promise<InquiryRecord[]> {
    if (this.storageBackend === 'mongodb') {
      const docs = await this.col<InquiryDoc>('inquiries')
        .find({})
        .sort({ createdAt: -1 })
        .limit(50)
        .toArray();
      return docs.map((d) => ({
        id: d._id.toHexString(),
        fullName: d.fullName,
        email: d.email,
        phone: d.phone,
        programLevel: d.programLevel,
        departmentCode: d.departmentCode,
        message: d.message,
        status: d.status,
        createdAt: d.createdAt,
      }));
    }
    return [...this.memInquiries];
  }

  async markInquiryReviewed(id: string): Promise<boolean> {
    if (this.storageBackend === 'mongodb') {
      if (!ObjectId.isValid(id)) return false;
      const res = await this.col<InquiryDoc>('inquiries').updateOne(
        { _id: new ObjectId(id) },
        { $set: { status: 'Reviewed' } }
      );
      return res.matchedCount === 1;
    }
    const target = this.memInquiries.find((i) => i.id === id);
    if (!target) return false;
    target.status = 'Reviewed';
    return true;
  }

  async listBookmarks(userId: string): Promise<BookmarkRecord[]> {
    if (this.storageBackend === 'mongodb') {
      const docs = await this.col<BookmarkDoc>('bookmarks')
        .find({ userId })
        .sort({ createdAt: -1 })
        .toArray();
      return docs.map((d) => ({
        id: d._id.toHexString(),
        userId: d.userId,
        itemType: d.itemType,
        itemId: d.itemId,
        title: d.title,
        subtitle: d.subtitle,
        createdAt: d.createdAt,
      }));
    }
    return this.memBookmarks.filter((b) => b.userId === userId);
  }

  async upsertBookmark(input: Omit<BookmarkRecord, 'id' | 'createdAt'>): Promise<BookmarkRecord> {
    const createdAt = new Date().toISOString();
    if (this.storageBackend === 'mongodb') {
      const col = this.col<BookmarkDoc>('bookmarks');
      const existing = await col.findOne({ userId: input.userId, itemId: input.itemId });
      if (existing) {
        return {
          id: existing._id.toHexString(),
          userId: existing.userId,
          itemType: existing.itemType,
          itemId: existing.itemId,
          title: existing.title,
          subtitle: existing.subtitle,
          createdAt: existing.createdAt,
        };
      }
      const _id = new ObjectId();
      await col.insertOne({ _id, ...input, createdAt });
      return { id: _id.toHexString(), ...input, createdAt };
    }

    const existing = this.memBookmarks.find(
      (b) => b.userId === input.userId && b.itemId === input.itemId
    );
    if (existing) return existing;

    const created: BookmarkRecord = {
      id: `bm-${crypto.randomUUID()}`,
      ...input,
      createdAt,
    };
    this.memBookmarks.unshift(created);
    return created;
  }

  async deleteBookmark(userId: string, itemId: string): Promise<boolean> {
    if (this.storageBackend === 'mongodb') {
      const res = await this.col<BookmarkDoc>('bookmarks').deleteOne({ userId, itemId });
      return res.deletedCount === 1;
    }
    const before = this.memBookmarks.length;
    this.memBookmarks = this.memBookmarks.filter(
      (b) => !(b.userId === userId && b.itemId === itemId)
    );
    return this.memBookmarks.length < before;
  }
}

export const pustRepo = new PustRepository();
