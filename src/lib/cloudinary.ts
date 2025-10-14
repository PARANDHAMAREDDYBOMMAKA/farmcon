import { v2 as cloudinary } from 'cloudinary'

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
})

export default cloudinary

export const uploadToCloudinary = async (file: Buffer, folder: string = 'farmcon'): Promise<string> => {
  try {
    const result = await new Promise((resolve, reject) => {
      cloudinary.uploader.upload_stream(
        {
          folder,
          resource_type: 'auto',
        },
        (error, result) => {
          if (error) reject(error)
          else resolve(result)
        }
      ).end(file)
    })

    return (result as any).secure_url
  } catch (error) {
    console.error('Cloudinary upload error:', error)
    throw new Error('Failed to upload image')
  }
}

export const deleteFromCloudinary = async (imageUrl: string): Promise<void> => {
  try {

    const urlParts = imageUrl.split('/')
    const uploadIndex = urlParts.findIndex(part => part === 'upload')

    if (uploadIndex === -1) {
      console.warn('Invalid Cloudinary URL:', imageUrl)
      return
    }

    const pathAfterUpload = urlParts.slice(uploadIndex + 1)

    const publicIdParts = pathAfterUpload[0]?.match(/^v\d+$/)
      ? pathAfterUpload.slice(1)
      : pathAfterUpload

    const publicIdWithExtension = publicIdParts.join('/')
    const publicId = publicIdWithExtension.replace(/\.[^/.]+$/, '')

    if (!publicId) {
      console.warn('Could not extract public_id from URL:', imageUrl)
      return
    }

    await cloudinary.uploader.destroy(publicId)
    console.log('Successfully deleted image from Cloudinary:', publicId)
  } catch (error) {
    console.error('Cloudinary deletion error:', error)
    
  }
}

export const deleteMultipleFromCloudinary = async (imageUrls: string[]): Promise<void> => {
  try {
    await Promise.all(imageUrls.map(url => deleteFromCloudinary(url)))
  } catch (error) {
    console.error('Cloudinary multiple deletion error:', error)
  }
}