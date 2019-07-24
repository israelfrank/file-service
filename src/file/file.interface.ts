import { ObjectID } from 'mongodb';
export class PrimitiveFile
{
  id?: string = '';
  key?: string = '';
  bucket?: string = '';
  name: string = '';
  displayName?: string = '';
  fullExtension?: string = '';
  type: string = '';
  description?: string = '';
  ownerID: string = '';
  size: number = 0;
  parent?: ObjectID | string = '';
  createdAt?: Date | number = 0;
  updatedAt?: Date | number = 0;
  children?: PrimitiveFile[] = [];
  [key: string]: string | number | ObjectID | Date | PrimitiveFile[];

  constructor(file: Partial<PrimitiveFile>) {
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
  }
}
export class IFile extends PrimitiveFile{
  children?: IFile[] = [];
  createdAt?: Date =  new Date();
  updatedAt?: Date = new Date();

  constructor(resFile: ResFile) {
    super(resFile);
    this.createdAt = new Date(resFile.createdAt);
    this.updatedAt = new Date(resFile.updatedAt);
    if (resFile.children) {
      for (let i = 0 ; i < resFile.children.length ; i++) {
        new IFile(resFile.children[i]);
      }
    }
  }
}

// Same as IFile, but changing types accordingly
export class ResFile extends PrimitiveFile {
  createdAt: number;
  updatedAt: number;
  children?: ResFile[] = [];

  constructor(file: IFile) {
    super(file);
    this.createdAt = file.createdAt.getTime();
    this.updatedAt = file.updatedAt.getTime();
    if (file.children) {
      for (let i = 0 ; i < file.children.length ; i++) {
        new ResFile(file.children[i]);
      }
    }
  }
}
