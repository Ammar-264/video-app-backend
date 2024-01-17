import {v2 as cloudinary} from 'cloudinary';
import fs from 'fs'
          
// cloudinary.config({ 
//   cloud_name: process.env.CLOUD_NAME, 
//   api_key: process.env.CLOUD_API_KEY, 
//   api_secret: process.env.CLOUD_API_SECRET
// });

cloudinary.config({ 
    cloud_name: 'dlrw3bzqj', 
    api_key: '948371683318187', 
    api_secret: 'jJMWeNSpapWUvyRqfwd8i8VDCIk' 
  });


const uploadOnCloudinary =async (localFilePath)=>{
    try {
        if (!localFilePath) return null
        
        // upload file on cloudinary

       const res = await cloudinary.uploader.upload(localFilePath,
            {
                resource_type:'auto'
            })

            // file uploaded successfully
            fs.unlinkSync(localFilePath)
            return res
    } catch (error) {
        console.log(error);
        fs.unlinkSync(localFilePath) // remove locally saved temporary file as the upload operation got failed

        return null
    }
}

export {uploadOnCloudinary}

          
