import { v2 as cloudinary } from 'cloudinary'

// Configure Cloudinary
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
})

export default cloudinary

// Upload image to Cloudinary
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

// Delete image from Cloudinary by URL
export const deleteFromCloudinary = async (imageUrl: string): Promise<void> => {
  try {
    // Extract public_id from Cloudinary URL
    // URL format: https://res.cloudinary.com/{cloud_name}/image/upload/v{version}/{folder}/{public_id}.{extension}
    const urlParts = imageUrl.split('/')
    const uploadIndex = urlParts.findIndex(part => part === 'upload')

    if (uploadIndex === -1) {
      console.warn('Invalid Cloudinary URL:', imageUrl)
      return
    }

    // Get everything after 'upload/v{version}/' or 'upload/'
    const pathAfterUpload = urlParts.slice(uploadIndex + 1)

    // Remove version number if present (starts with 'v' followed by numbers)
    const publicIdParts = pathAfterUpload[0]?.match(/^v\d+$/)
      ? pathAfterUpload.slice(1)
      : pathAfterUpload

    // Join the remaining parts and remove file extension
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
    // Don't throw error - we don't want to fail the delete operation if Cloudinary deletion fails
  }
}

// Delete multiple images from Cloudinary
export const deleteMultipleFromCloudinary = async (imageUrls: string[]): Promise<void> => {
  try {
    await Promise.all(imageUrls.map(url => deleteFromCloudinary(url)))
  } catch (error) {
    console.error('Cloudinary multiple deletion error:', error)
  }
}