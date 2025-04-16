import { Collection, Db, Document, Filter, FindOptions, ObjectId, OptionalUnlessRequiredId, UpdateFilter, WithId } from 'mongodb';
import { connectToDatabase } from '../mongodb';

/**
 * Base repository class for MongoDB collections
 * Provides common CRUD operations and utility methods
 */
export abstract class BaseRepository<T extends Document> {
  protected collectionName: string;
  protected db: Db | null = null;
  protected collection: Collection<T> | null = null;

  constructor(collectionName: string) {
    this.collectionName = collectionName;
  }

  /**
   * Initialize the database connection and collection
   */
  protected async initialize(): Promise<void> {
    if (!this.db || !this.collection) {
      const { db } = await connectToDatabase();
      this.db = db;
      this.collection = db.collection<T>(this.collectionName);
    }
  }

  /**
   * Find a document by its ID
   */
  async findById(id: string | ObjectId): Promise<T | null> {
    await this.initialize();
    const objectId = typeof id === 'string' ? new ObjectId(id) : id;
    return this.collection!.findOne({ _id: objectId } as Filter<T>);
  }

  /**
   * Find documents by a filter
   */
  async find(filter: Filter<T> = {}, options?: FindOptions<T>): Promise<T[]> {
    await this.initialize();
    return this.collection!.find(filter, options).toArray();
  }

  /**
   * Find a single document by a filter
   */
  async findOne(filter: Filter<T>): Promise<T | null> {
    await this.initialize();
    return this.collection!.findOne(filter);
  }

  /**
   * Count documents by a filter
   */
  async count(filter: Filter<T> = {}): Promise<number> {
    await this.initialize();
    return this.collection!.countDocuments(filter);
  }

  /**
   * Create a new document
   */
  async create(data: OptionalUnlessRequiredId<T>): Promise<T> {
    await this.initialize();
    const result = await this.collection!.insertOne(data);
    return { ...data, _id: result.insertedId } as T;
  }

  /**
   * Update a document by its ID
   */
  async updateById(id: string | ObjectId, update: UpdateFilter<T> | Partial<T>): Promise<T | null> {
    await this.initialize();
    const objectId = typeof id === 'string' ? new ObjectId(id) : id;
    
    // If update is not using operators like $set, wrap it in $set
    const updateOperation = Object.keys(update).some(key => key.startsWith('$'))
      ? update
      : { $set: { ...update, updatedAt: new Date() } };
    
    const result = await this.collection!.findOneAndUpdate(
      { _id: objectId } as Filter<T>,
      updateOperation,
      { returnDocument: 'after' }
    );
    
    return result;
  }

  /**
   * Update documents by a filter
   */
  async updateMany(filter: Filter<T>, update: UpdateFilter<T>): Promise<number> {
    await this.initialize();
    
    // If update is not using operators like $set, wrap it in $set
    const updateOperation = Object.keys(update).some(key => key.startsWith('$'))
      ? update
      : { $set: { ...update, updatedAt: new Date() } };
    
    const result = await this.collection!.updateMany(filter, updateOperation);
    return result.modifiedCount;
  }

  /**
   * Delete a document by its ID
   */
  async deleteById(id: string | ObjectId): Promise<boolean> {
    await this.initialize();
    const objectId = typeof id === 'string' ? new ObjectId(id) : id;
    const result = await this.collection!.deleteOne({ _id: objectId } as Filter<T>);
    return result.deletedCount === 1;
  }

  /**
   * Delete documents by a filter
   */
  async deleteMany(filter: Filter<T>): Promise<number> {
    await this.initialize();
    const result = await this.collection!.deleteMany(filter);
    return result.deletedCount;
  }

  /**
   * Find documents with pagination
   */
  async findPaginated(
    filter: Filter<T> = {},
    page: number = 1,
    limit: number = 10,
    options?: FindOptions<T>
  ): Promise<{ data: T[]; total: number; page: number; limit: number; hasMore: boolean }> {
    await this.initialize();
    
    const skip = (page - 1) * limit;
    const [data, total] = await Promise.all([
      this.collection!.find(filter, options).skip(skip).limit(limit).toArray(),
      this.collection!.countDocuments(filter)
    ]);
    
    return {
      data,
      total,
      page,
      limit,
      hasMore: skip + data.length < total
    };
  }
}
