import { MulterOptions } from "@nestjs/platform-express/multer/interfaces/multer-options.interface";

export const constant = {
  MAX_FILE_SIZE: 100 * 1024 * 1024,
  ALLOWED_MIME_TYPES: [
    'image/jpeg',
    'image/jpg',
    'image/png',
    'image/svg',
    'image/tiff',
    'image/webp',
  ],
  ALLOWED_MIME_TYPES_DOCUMENTS: [
    'application/msword',
    'application/pdf',
    'text/plain',
    'application/x-debian-package'
  ],
    ALLOWED_MIME_TYPES_VIDEO: [
    'video/mp4',
    'video/x-msvideo',
    'video/x-ms-wmv',
    'video/x-flv',
    'video/quicktime'
  ],
  ALLOWED_MIME_TYPES_AUDIO: [
    'audio/mpeg3',
    'audio/x-mpeg-3',
    'audio/mpeg'
  ],


  IMAGE_DEFAULT_URL:
    'https://www.freedigitalphotos.net/images/img/homepage/394230.jpg',
  RATE_LIMIT_SECONDS: 15 * 60 * 1000,
  RATE_LIMIT_MAX_REQUESTS: 100,

  UTC: 2 * 60 * 60 * 1000,
};

export const multerOptions: MulterOptions = {
  limits: {
    files: 10
  }
}

export const notificationOptions = {
  high: {  
    priority: "high",
    timeToLive: 60 * 60 * 24,
    contentAvailable: true
  }, 
  low: {
    priority: "normal",
    timeToLive: 60 * 60 * 24,
  }
}