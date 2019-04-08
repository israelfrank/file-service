import mongoose from 'mongoose';
import * as dotenv from 'dotenv';
import * as chai from 'chai';

const expect: Chai.ExpectStatic = chai.expect;
dotenv.config({ path: '.env' });

(<any>mongoose).Promise = Promise;

process.on('unhandledRejection', (reason, p) => {
  console.log('Unhandled Rejection at: Promise', p, 'reason:', reason);
  // application specific logging, throwing an error, or other logic here
});

const mochaAsync = (func: Function) => {
  return async (done: Function) => {
    try {
      await func();
      done();
    } catch (err) {
      done(err);
    }
  };
};

export const expectError = async (func: Function, params: any[]) => {
  let isError = false;
  let currError;
  try {
    await func(...params);
  } catch (err) {
    currError = err;
    err.should.exist;
    isError = true;
  } finally {
    isError.should.be.true;
    return currError;
  }
};

before(async () => {
  await mongoose.connect('mongodb://localhost:27017/file');
});

after((done) => {
  mongoose.connection.close();
  done();
});
