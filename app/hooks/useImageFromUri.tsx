'use client'

import { useState, useEffect } from 'react'

// Cache for fetched images to avoid repeated requests
const imageCache = new Map<string, string | null>()

export const useImageFromUri = (uri: string | undefined, fallbackImage?: string) => {
  const [imageUrl, setImageUrl] = useState<string | undefined>(fallbackImage)
  const [loading, setLoading] = useState(false)
  const [socialLinks, setSocialLinks] = useState<{twitter?: string, website?: string}>({})

  useEffect(() => {
    if (!uri) {
      setImageUrl(fallbackImage)
      return
    }

    // If URI is already an image URL, use it directly
    if (uri.includes('http') && (uri.includes('.png') || uri.includes('.jpg') || uri.includes('.jpeg') || uri.includes('.webp') || uri.includes('.gif'))) {
      setImageUrl(uri)
      return
    }

    // Check cache first
    if (imageCache.has(uri)) {
      const cached = imageCache.get(uri)
      setImageUrl(cached || fallbackImage)
      return
    }

    // Fetch metadata from URI
    const fetchImageFromMetadata = async () => {
      setLoading(true)
      
      try {
        // Convert IPFS URLs to HTTP gateway
        let fetchUrl = uri
        if (uri.startsWith('ipfs://')) {
          fetchUrl = uri.replace('ipfs://', 'https://ipfs.io/ipfs/')
        }

        if (fetchUrl.includes('http')) {
          const response = await fetch(fetchUrl, {
            method: 'GET',
            headers: {
              'Accept': 'application/json',
            },
            signal: AbortSignal.timeout(5000) // 5 second timeout
          })

          if (response.ok) {
            const metadata = await response.json()
            let extractedImageUrl = metadata.image || metadata.image_url || metadata.logo

            // Convert IPFS image URLs to HTTP gateway
            if (extractedImageUrl && extractedImageUrl.startsWith('ipfs://')) {
              extractedImageUrl = extractedImageUrl.replace('ipfs://', 'https://ipfs.io/ipfs/')
            }

            // Extract social links from metadata
            const extractedSocialLinks: {twitter?: string, website?: string} = {}
            
            // Look for various social link formats
            if (metadata.twitter) extractedSocialLinks.twitter = metadata.twitter
            if (metadata.external_url) extractedSocialLinks.website = metadata.external_url
            if (metadata.website) extractedSocialLinks.website = metadata.website
            if (metadata.homepage) extractedSocialLinks.website = metadata.homepage
            
            // Handle Twitter X.com format
            if (extractedSocialLinks.twitter && !extractedSocialLinks.twitter.includes('http')) {
              extractedSocialLinks.twitter = `https://twitter.com/${extractedSocialLinks.twitter.replace('@', '')}`
            }

            setSocialLinks(extractedSocialLinks)

            if (extractedImageUrl) {
              imageCache.set(uri, extractedImageUrl)
              setImageUrl(extractedImageUrl)
            } else {
              imageCache.set(uri, null)
              setImageUrl(fallbackImage)
            }
          } else {
            imageCache.set(uri, null)
            setImageUrl(fallbackImage)
          }
        }
      } catch (error) {
        console.warn('Failed to fetch image from URI:', error)
        imageCache.set(uri, null)
        setImageUrl(fallbackImage)
      } finally {
        setLoading(false)
      }
    }

    fetchImageFromMetadata()
  }, [uri, fallbackImage])

  return { imageUrl, loading, socialLinks }
}
