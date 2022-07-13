import { Injectable, InternalServerErrorException, PayloadTooLargeException, ServiceUnavailableException, UnsupportedMediaTypeException } from '@nestjs/common';
import { S3 } from 'aws-sdk';
import { constant } from 'src/constants/constant';


@Injectable()
export class FileUploadService {

  async upload(file, bucketName: string) {
    const { originalname } = file;
    return await this.uploadS3(file.buffer, bucketName, originalname);
  }

  async uploadHouseholdVoiceMessage(file, bucketName: string, householdId: string) {
    const { originalname } = file;
    return await this.uploadS3(file.buffer, bucketName, `${householdId}/voice/${originalname}`);
  }

  async uploadHouseholdMessageDocument(file, bucketName: string, householdId: string) {
    const { originalname } = file;
    return await this.uploadS3(file.buffer, bucketName, `${householdId}/doc/${originalname}`);
  }

  async uploadHouseholdMessageImage(file, bucketName: string, householdId: string) {
    const { originalname } = file;
    return await this.uploadS3(file.buffer, bucketName, `${householdId}/img/${originalname}`);
  }

  async uploadContactVoiceMessage(file, bucketName: string, contactId: string) {
    const { originalname } = file;
    return await this.uploadS3(file.buffer, bucketName, `${contactId}/voice/${originalname}`);
  }

  async uploadContactMessageDocument(file, bucketName: string, contactId: string) {
    const { originalname } = file;
    return await this.uploadS3(file.buffer, bucketName, `${contactId}/doc/${originalname}`);
  }

  async uploadContactMessageImage(file, bucketName: string, contactId: string) {
    const { originalname } = file;
    return await this.uploadS3(file.buffer, bucketName, `${contactId}/img/${originalname}`);
  }


  async uploadS3(file, bucket: string, key?: string) {
    try {
      const s3 = this.getS3();
      const params = {
        Bucket: bucket,
        Key: key ? key : null,
        Body: file,
        ACL: 'public-read'
      };
      return await s3.upload(params, (err, data) => {
        if (err) {
          throw new ServiceUnavailableException(err);
        }
        return data;
      });
    } catch (err) {
      throw new InternalServerErrorException(err)
    }
  }

  getS3() {
    return new S3({
      accessKeyId: process.env.AWS_ACCESS_KEY_ID,
      secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
    });
  }

  async delete(imageName, bucketName: string) {
    const s3 = this.getS3();
    const params = {
      Bucket: bucketName,
      Key: imageName.slice(process.env.S3_BUCKET_URL_PROFILE_IMAGES.length),
    };

    await s3.createBucket({ Bucket: bucketName }, function () {
      s3.deleteObject(params, function (err, data) {
        if (err) {
          throw new ServiceUnavailableException(err);
        }
        return data;
      });
    });
  }

  isFileValid(file) {
    if (file.size > constant.MAX_FILE_SIZE) {
      throw new PayloadTooLargeException();
    }

    if (!constant.ALLOWED_MIME_TYPES.includes(file.mimetype)) {
      throw new UnsupportedMediaTypeException();
    }
  }

  isAudioValid(file) {
    if (file.size > constant.MAX_FILE_SIZE) {
      throw new PayloadTooLargeException();
    }
    if (!constant.ALLOWED_MIME_TYPES_AUDIO.includes(file.mimetype)) {
      throw new UnsupportedMediaTypeException();
    }
  }

  isVideoValid(file) {
    if (!constant.ALLOWED_MIME_TYPES_VIDEO.includes(file.mimetype)) {
      throw new UnsupportedMediaTypeException();
    }
  }

  isDocumentValid(file) {
    console.log(file.mimetype, typeof file.mimetype)
    if (file.size > constant.MAX_FILE_SIZE) {
      throw new PayloadTooLargeException();
    }
    if (
      ![
        ...constant.ALLOWED_MIME_TYPES_DOCUMENTS,
        ...constant.ALLOWED_MIME_TYPES,
        ...constant.ALLOWED_MIME_TYPES_VIDEO
      ].includes(file.mimetype)
    ) {
      throw new UnsupportedMediaTypeException();
    }
  }

  isDocumentValidForChild(file) {
    console.log(file.mimetype, typeof file.mimetype)
    if (file.size > constant.MAX_FILE_SIZE) {
      throw new PayloadTooLargeException();
    }
    if (
      ![
        ...constant.ALLOWED_MIME_TYPES_DOCUMENTS,
        ...constant.ALLOWED_MIME_TYPES,
      ].includes(file.mimetype)
    ) {
      throw new UnsupportedMediaTypeException();
    }
  }
}
