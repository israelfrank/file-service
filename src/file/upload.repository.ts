import { IUpload } from './upload.interface';
import { uploadModel } from './upload.model';

/**
 * The repository connects the file-service with the mongo DB.
 * It is the 'lowest' level of code before making changes in the database or retrieving information from it.
 * Usually called from the FileService class in file.service.ts .
 */
export class UploadRepository {
  /**
   * Creates a new upload object in the DB.
   * @param upload - the upload to be created.
   */
  static create(upload: Partial<IUpload>): Promise<IUpload> {
    return uploadModel.create(upload);
  }

  /**
   * Deletes an upload by its id.
   * @param uploadID - the id of the upload.
   */
  static deleteById(uploadID: string): Promise<IUpload | null> {
    return uploadModel.findOneAndRemove({ uploadID }).exec();
  }

  /**
   * Retrieve an upload by its id.
   * @param uploadID - the id of the upload.
   */
  static getById(uploadID: string): Promise<IUpload | null> {
    return uploadModel.findOne({ uploadID }).exec();
  }

  /**
   * Update the upload ID with the given ID
   * @param key - the key of the upload. is unique with bucket.
   * @param bucket - the bucket of the upload.
   * @param newID - the new id.
   */
  static updateByKey(key: string, bucket: string, newID: string) {
    return uploadModel.findOneAndUpdate({ key, bucket }, { uploadID: newID }, { new: true }).exec();
  }
}
