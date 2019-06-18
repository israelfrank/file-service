import { Document, Schema, model } from 'mongoose';
import { ServerError } from '../utils/errors/application.error';
import { IQuota } from './quota.interface';
import { MongoError } from 'mongodb';
import { KeyAlreadyExistsError } from '../utils/errors/client.error';
import { NextFunction } from 'connect';

const KiB = 1024;
const MiB = 1024 * KiB;
const GiB = 1024 * MiB;
export const quotaSchema: Schema = new Schema(
  {
    ownerID: {
      type: String,
      required: true,
      unique: true,
    },
    limit: {
      type: Number,
      required: true,
      default: 100 * GiB,
    },
    used: {
      type: Number,
      required: true,
      default: 0,
    },
  },
  {
    timestamps: true,
  }
);

// ******* SAME AS FILE *******//
// handleE11000 is called when there is a duplicateKey Error
const handleE11000 = function (error: MongoError, _: any, next: NextFunction) {
  if (error.name === 'MongoError' && error.code === 11000) {
    next(new KeyAlreadyExistsError(this.key));
  } else {
    next();
  }
};

quotaSchema.post('save', handleE11000);
quotaSchema.post('update', handleE11000);
quotaSchema.post('findOneAndUpdate', handleE11000);

quotaSchema.post('save', (error: MongoError, _: any, next: NextFunction) => {
  if (error.name === 'MongoError') {
    next(new ServerError(error.message));
  }
  next(error);
});

// ***************************//

export const quotaModel = model<IQuota & Document>('quotas', quotaSchema);