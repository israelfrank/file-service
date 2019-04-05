import mongoose from 'mongoose';
import { ServerError } from '../errors/application.error';
import { IFile } from './file.interface';
import { KeyAlreadyExistsError } from '../errors/client.error';
import { MongoError } from 'mongodb';

const ObjectId = mongoose.Schema.Types.ObjectId;

export const fileSchema: mongoose.Schema = new mongoose.Schema(
  {
    key: {
      type: String,
      unique: true,
    },
    displayName: {
      type: String,
      required: true,
    },
    fullExtension: {
      type: String,
    },
    type: {
      type: String,
      required: true,
    },
    description: {
      type: String,
      default: '',
    },
    ownerID: {
      type: String,
      required: true,
    },
    size: {
      type: Number,
      default: 0,
    },
    isRootFolder: {
      type: Boolean,
      default: false,
    },
    parent: {
      type: ObjectId,
      ref: 'File',
      default: null,
    }
  },
  {
    timestamps: true,
    toObject: {
      virtuals: true,
    },
    toJSON: {
      virtuals: true,
    }
  });

fileSchema.virtual('id').set(() => {
  return this._id;
});

fileSchema.virtual('fullName').set(function (name: string) {
  this.displayName = name.split('.')[0];
  this.fullExtension = name.split('.').splice(1).join('.');
});

// handleE11000 is called when there is a duplicateKey Error
const handleE11000 = function (error: MongoError, res: any, next: any) {
  if (error.name === 'MongoError' && error.code === 11000) {
    next(new KeyAlreadyExistsError(this.key));
  } else {
    next();
  }
};

fileSchema.post('save', handleE11000);
fileSchema.post('update', handleE11000);
fileSchema.post('findOneAndUpdate', handleE11000);
fileSchema.post('insertMany', handleE11000);

fileSchema.post('save', (error, doc, next) => {
  if (error.name === 'MongoError') {
    next(new ServerError(error.message));
  }
  next(error);
});

export const fileModel = mongoose.model<IFile & mongoose.Document>('File', fileSchema);
