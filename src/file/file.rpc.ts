// Add this to the VERY top of the first file loaded in your app
const apm = require('elastic-apm-node').start({
    // Override service name from package.json
  // Allowed characters: a-z, A-Z, 0-9, -, _, and space
  serviceName: 'file-service',

  // Use if APM Server requires a token
  secretToken: '',

  // Set custom APM Server URL (default: http://localhost:8200)
  serverUrl: 'http://13.69.137.179:8200',
});

import { FileService } from './file.service';
import { IFile } from './file.interface';
import { ObjectID } from 'mongodb';
import { GrpcHealthCheck, HealthCheckResponse, HealthService } from 'grpc-ts-health-check';

const grpc = require('grpc-middleware');
const protoLoader = require('@grpc/proto-loader');

const PROTO_PATH = `${__dirname}/../../proto/file.proto`;

// Suggested options for similarity to existing grpc.load behavior
const packageDefinition = protoLoader.loadSync(
  PROTO_PATH,
  {
    keepCase: true,
    longs: String,
    enums: String,
    defaults: true,
    oneofs: true,
  });

export const serviceNames: string[] = ['', 'file.fileService'];
export const healthCheckStatusMap = {
  '': HealthCheckResponse.ServingStatus.UNKNOWN,
  serviceName: HealthCheckResponse.ServingStatus.UNKNOWN
};

// Has the full package hierarchy
const protoDescriptor = grpc.loadPackageDefinition(packageDefinition);
const file_proto = protoDescriptor.file;

/**
 * The FileServer class, containing all of the FileServer methods.
 */
export class FileServer {
  public server: any;
  public grpcHealthCheck: GrpcHealthCheck;
  public constructor(port: string) {
    this.server = new grpc.Server({}, () => {}, (context: any, call: any) => this.post());

    // Register the health service
    this.grpcHealthCheck = new GrpcHealthCheck(healthCheckStatusMap);
    this.server.addService(HealthService, this.grpcHealthCheck);
    this.server.addService(
      file_proto.FileService.service,
      {
        GenerateKey: this.wrapper(this.generateKey),
        CreateUpload: this.wrapper(this.createUpload),
        UpdateUploadID: this.wrapper(this.updateUpload),
        GetUploadByID: this.wrapper(this.getUploadByID),
        DeleteUploadByID: this.wrapper(this.deleteUploadByID),
        GetFileByID: this.wrapper(this.getFileByID),
        GetFileByKey: this.wrapper(this.getFileByKey),
        GetFilesByFolder: this.wrapper(this.getFilesByFolder),
        CreateFile: this.wrapper(this.createFile),
        DeleteFile: this.wrapper(this.deleteFile),
        IsAllowed: this.wrapper(this.isAllowed),
      }
    );
    this.server.bind(`0.0.0.0:${port}`, grpc.ServerCredentials.createInsecure());
  }

  private post() {
    console.log('post called');
    apm.endTransaction('successful');
  }

  private wrapper(func: any) : any{
    return (call:any,callback:any)=>{
      try {
        apm.startTransaction(func.name, 'monitoringFS');
        func(call,callback);
      } catch (err) {
        callback(err);
      }
    }

  }

  // ******************** UPLOAD FUNCTIONS ******************** */

  // Generates a random key for the upload.
  private generateKey(call: any, callback: any) {
    const key: string = FileService.generateKey();
    callback(null, { key });
  }

  // Creates an upload object, present while uploading a file.
  private async createUpload(call: any, callback: any) {
    const key: string = FileService.generateKey();
    const bucket: string = call.request.bucket;
    const name: string = call.request.name;
    const ownerID: string = call.request.ownerID;
    const parent: string = call.request.parent;
    const size: number = parseInt(call.request.size, 10);
    FileService.createUpload(
      key,
      bucket,
      name,
      ownerID,
      parent,
      size)
      .then((upload) => {
        apm.endTransaction('happy');
        // console.log(call.request.trans.id);
        callback(null, upload);
      }).catch(err => callback(err));
  }

  // Updates the uploadID.
  private async updateUpload(call: any, callback: any) {
    const key: string = call.request.key;
    const uploadID: string = call.request.uploadID;
    const bucket: string = call.request.bucket;
    FileService.updateUpload(
      uploadID,
      key,
      bucket)
      .then((upload) => {
        callback(null, upload);
      }).catch(err => callback(err));
  }

  // Get an upload metadata by its id in the DB.
  private async getUploadByID(call: any, callback: any) {
    const id = call.request.uploadID;
    FileService.getUploadById(id)
      .then((upload) => {
        callback(null, upload);
      }).catch(err => callback(err));
  }

  //  Delete an upload from the DB by its id.
  private async deleteUploadByID(call: any, callback: any) {
    const id = call.request.uploadID;
    FileService.deleteUpload(id)
      .then((upload) => {
        callback(null, upload);
      }).catch(err => callback(err));
  }

  // ********************* FILE FUNCTIONS ********************* */

  // Creates a new file in the DB.
  private async createFile(call: any, callback: any) {
    const params = call.request;

    FileService.create(
      params.bucket,
      params.name,
      params.ownerID,
      params.type,
      params.parent,
      params.key,
      parseInt(params.size, 10))
      .then((file) => {
        callback(null, new ResFile(file));
      })
      .catch(err => callback(err));
  }

  // Deletes a file, according to the file deletion policy.
  private async deleteFile(call: any, callback: any) {
    const id: string = call.request.id;
    FileService.delete(id)
      .then(() => callback(null, { ok: true }))
      .catch(err => callback(err));
  }

  // Retrieves a file by its id.
  private async getFileByID(call: any, callback: any) {
    const id: string = call.request.id;
    FileService.getById(id)
      .then(file => callback(null, new ResFile(file)))
      .catch(err => callback(err));
  }

  // Retrieves a file by its key.
  private async getFileByKey(call: any, callback: any) {
    const key: string = call.request.key;
    FileService.getByKey(key)
      .then(file => callback(null, new ResFile(file)))
      .catch(err => callback(err));
  }

  // Retrieves all files residing in a given folder.
  private async getFilesByFolder(call: any, callback: any) {
    const folderID: string = call.request.folderID;
    const ownerID: string = call.request.ownerID;
    FileService.getFilesByFolder(folderID, ownerID)
      .then((files) => {
        const resFiles = files.length ? files.map(file => new ResFile(file)) : [];
        callback(null, { files: resFiles });
      })
      .catch(err => callback(err));
  }

  // Checks if an operation is allowed by permission of the owner.
  private async isAllowed(call: any, callback: any) {
    FileService.isOwner(call.request.fileID, call.request.userID)
      .then(res => callback(null, { allowed: res }))
      .catch(err => callback(err));
  }

}

// Same as IFile, but changing types accordingly
class ResFile {
  id: string;
  key: string;
  bucket: string;
  displayName: string;
  fullExtension: string;
  name: string;
  type: string;
  description: string;
  ownerID: string;
  size: number;
  parent: ObjectID | string;
  deleted: boolean;
  createdAt: number;
  updatedAt: number;

  constructor(file: IFile) {
    this.id = file.id;
    this.key = file.key;
    this.bucket = file.bucket;
    this.displayName = file.displayName;
    this.fullExtension = file.fullExtension;
    this.name = file.name;
    this.type = file.type;
    this.description = file.description;
    this.ownerID = file.ownerID;
    this.size = file.size;
    this.parent = file.parent;
    this.deleted = file.deleted;
    this.createdAt = file.createdAt.getTime();
    this.updatedAt = file.updatedAt.getTime();
  }
}
