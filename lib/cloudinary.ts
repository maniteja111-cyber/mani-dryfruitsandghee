import { v2 as cloudinary } from 'cloudinary'

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
})

export default cloudinary

export async function uploadToCloudinary(buffer: Buffer, filename: string): Promise<string> {
  return new Promise((resolve, reject) => {
    cloudinary.uploader
      .upload_stream(
        {
          resource_type: 'auto',
          transformation: [
            { width: 1200, height: 1200, crop: 'limit' },
            { quality: 'auto' },
          ],
        },
        (error, result) => {
          if (error) {
            console.error('Cloudinary upload error:', error)
            reject(error)
          } else {
            resolve(result?.secure_url || '')
          }
        }
      )
      .end(buffer)
  })
}