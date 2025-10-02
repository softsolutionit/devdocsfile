export const compressImage = (file, maxSizeKB = 150) => {
  return new Promise((resolve) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    
    reader.onload = (event) => {
      const img = new Image();
      img.src = event.target.result;
      
      img.onload = () => {
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        
        // Calculate new dimensions while maintaining aspect ratio
        let width = img.width;
        let height = img.height;
        const maxDimension = 1200; // Max width or height
        
        if (width > height && width > maxDimension) {
          height *= maxDimension / width;
          width = maxDimension;
        } else if (height > maxDimension) {
          width *= maxDimension / height;
          height = maxDimension;
        }
        
        canvas.width = width;
        canvas.height = height;
        
        // Draw image with new dimensions
        ctx.drawImage(img, 0, 0, width, height);
        
        // Initial quality
        let quality = 0.9;
        let result;
        
        // Function to check size and adjust quality if needed
        const checkSize = () => {
          result = canvas.toDataURL('image/jpeg', quality);
          const sizeInKB = (result.length * 0.75) / 1024; // Approximate size in KB
          
          if (sizeInKB > maxSizeKB && quality > 0.2) {
            quality -= 0.1;
            return checkSize();
          }
          
          // Convert base64 to Blob
          const byteString = atob(result.split(',')[1]);
          const mimeString = result.split(',')[0].split(':')[1].split(';')[0];
          const ab = new ArrayBuffer(byteString.length);
          const ia = new Uint8Array(ab);
          
          for (let i = 0; i < byteString.length; i++) {
            ia[i] = byteString.charCodeAt(i);
          }
          
          return new File([ab], file.name, { type: mimeString });
        };
        
        resolve(checkSize());
      };
    };
  });
};
