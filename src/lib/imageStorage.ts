/**
 * Modular Image Storage Service for MockMatrix Question & Diagram Images
 * Supports multiple providers to overcome Supabase storage quotas:
 * 1. ImgBB (Unlimited free public image hosting via free API key)
 * 2. GitHub + jsDelivr CDN (100% free unlimited repo-based CDN)
 * 3. Cloudinary (25 GB free storage/bandwidth)
 * 4. Supabase Storage Bucket ('question-images')
 */

import { supabaseAdmin, supabase } from './supabase';

export interface UploadResult {
  url: string;
  provider: 'imgbb' | 'github' | 'cloudinary' | 'supabase' | 'fallback';
}

/**
 * Uploads an image buffer or remote URL to the best configured storage provider.
 * Priority:
 * 1. ImgBB (if IMGBB_API_KEY is present - unlimited free image hosting)
 * 2. Cloudinary (if CLOUDINARY_URL or CLOUDINARY_CLOUD_NAME is present - 25GB free)
 * 3. GitHub Assets Repo (if GITHUB_ASSETS_TOKEN is present - free CDN via jsDelivr)
 * 4. Supabase Storage (question-images bucket)
 */
export async function uploadImageToBestProvider(
  sourceUrlOrBuffer: string | Buffer,
  targetPath: string
): Promise<string> {
  let imageBuffer: Buffer;
  let mimeType = 'image/jpeg';

  try {
    if (typeof sourceUrlOrBuffer === 'string') {
      if (sourceUrlOrBuffer.startsWith('data:image/')) {
        const matches = sourceUrlOrBuffer.match(/^data:([A-Za-z-+\/]+);base64,(.+)$/);
        if (matches && matches.length === 3) {
          mimeType = matches[1];
          imageBuffer = Buffer.from(matches[2], 'base64');
        } else {
          imageBuffer = Buffer.from(sourceUrlOrBuffer);
        }
      } else if (sourceUrlOrBuffer.startsWith('http://') || sourceUrlOrBuffer.startsWith('https://')) {
        // If image is already on an external CDN (e.g. jsDelivr, Cloudinary, ImgBB, or Supabase), return it
        if (
          sourceUrlOrBuffer.includes('jsdelivr.net') ||
          sourceUrlOrBuffer.includes('cloudinary.com') ||
          sourceUrlOrBuffer.includes('ibb.co') ||
          sourceUrlOrBuffer.includes('supabase.co/storage')
        ) {
          return sourceUrlOrBuffer;
        }

        const res = await fetch(sourceUrlOrBuffer, {
          headers: {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)',
            'Accept': 'image/avif,image/webp,image/apng,image/svg+xml,image/*,*/*;q=0.8'
          }
        });
        if (!res.ok) {
          console.warn(`Could not download image from ${sourceUrlOrBuffer}: HTTP ${res.status}`);
          return sourceUrlOrBuffer;
        }
        const arrayBuf = await res.arrayBuffer();
        imageBuffer = Buffer.from(arrayBuf);
        mimeType = res.headers.get('content-type') || 'image/jpeg';
      } else {
        imageBuffer = Buffer.from(sourceUrlOrBuffer);
      }
    } else {
      imageBuffer = sourceUrlOrBuffer;
    }

    // 1. Try ImgBB (Unlimited free image hosting: https://api.imgbb.com/)
    const imgbbKey = process.env.IMGBB_API_KEY;
    if (imgbbKey) {
      try {
        const formData = new URLSearchParams();
        formData.append('key', imgbbKey);
        formData.append('image', imageBuffer.toString('base64'));
        formData.append('name', targetPath.replace(/[^a-zA-Z0-9_-]/g, '_'));

        const bbRes = await fetch('https://api.imgbb.com/1/upload', {
          method: 'POST',
          headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
          body: formData.toString()
        });

        const bbJson = await bbRes.json();
        if (bbJson?.success && bbJson.data?.url) {
          return bbJson.data.display_url || bbJson.data.url;
        }
      } catch (err: any) {
        console.warn('ImgBB upload error, falling back:', err.message);
      }
    }

    // 2. Try GitHub Repository as CDN (via jsDelivr free global CDN)
    const githubToken = process.env.GITHUB_ASSETS_TOKEN || process.env.GITHUB_TOKEN;
    const githubRepo = process.env.GITHUB_ASSETS_REPO; // e.g. "username/mockmatrix-assets"
    if (githubToken && githubRepo) {
      try {
        const cleanPath = `${targetPath.replace(/^\/+/, '')}.jpg`;
        const ghUrl = `https://api.github.com/repos/${githubRepo}/contents/${cleanPath}`;
        
        const ghRes = await fetch(ghUrl, {
          method: 'PUT',
          headers: {
            'Authorization': `Bearer ${githubToken}`,
            'Accept': 'application/vnd.github+json',
            'Content-Type': 'application/json',
            'User-Agent': 'MockMatrix-Storage'
          },
          body: JSON.stringify({
            message: `Upload exam asset: ${cleanPath}`,
            content: imageBuffer.toString('base64')
          })
        });

        if (ghRes.ok) {
          // Serve via jsDelivr CDN for lightning-fast worldwide cached delivery
          return `https://cdn.jsdelivr.net/gh/${githubRepo}@main/${cleanPath}`;
        }
      } catch (err: any) {
        console.warn('GitHub CDN upload error, falling back:', err.message);
      }
    }

    // 3. Try Cloudinary (if configured)
    const cloudName = process.env.CLOUDINARY_CLOUD_NAME;
    const cloudApiKey = process.env.CLOUDINARY_API_KEY;
    const cloudApiSecret = process.env.CLOUDINARY_API_SECRET;
    if (cloudName && cloudApiKey && cloudApiSecret) {
      try {
        const crypto = await import('crypto');
        const timestamp = Math.floor(Date.now() / 1000);
        const cleanPublicId = targetPath.replace(/[^a-zA-Z0-9_\-\/]/g, '_');
        
        // Generate official SHA-1 signature for Cloudinary API
        const toSign = `public_id=${cleanPublicId}&timestamp=${timestamp}${cloudApiSecret}`;
        const signature = crypto.createHash('sha1').update(toSign).digest('hex');

        const formData = new FormData();
        const base64Data = `data:${mimeType};base64,${imageBuffer.toString('base64')}`;
        formData.append('file', base64Data);
        formData.append('public_id', cleanPublicId);
        formData.append('api_key', cloudApiKey);
        formData.append('timestamp', String(timestamp));
        formData.append('signature', signature);

        const cldRes = await fetch(`https://api.cloudinary.com/v1_1/${cloudName}/image/upload`, {
          method: 'POST',
          body: formData
        });

        const cldJson = await cldRes.json();
        if (cldJson?.secure_url) {
          return cldJson.secure_url;
        } else if (cldJson?.error?.message) {
          console.warn('Cloudinary upload warning:', cldJson.error.message);
        }
      } catch (err: any) {
        console.warn('Cloudinary upload error, falling back:', err.message);
      }
    }

    // 4. Default: Supabase Storage
    const client = supabaseAdmin || supabase;
    if (client) {
      const fileName = `${targetPath}.jpg`;
      const { error: uploadError } = await client.storage
        .from('question-images')
        .upload(fileName, imageBuffer, {
          contentType: mimeType,
          upsert: true
        });

      if (!uploadError) {
        const { data: publicUrlData } = client.storage
          .from('question-images')
          .getPublicUrl(fileName);

        if (publicUrlData?.publicUrl) {
          return publicUrlData.publicUrl;
        }
      }
    }

    // Fallback: If original was a URL, keep it
    if (typeof sourceUrlOrBuffer === 'string') {
      return sourceUrlOrBuffer;
    }

    return '';
  } catch (err: any) {
    console.warn('Image storage failure:', err.message);
    return typeof sourceUrlOrBuffer === 'string' ? sourceUrlOrBuffer : '';
  }
}
