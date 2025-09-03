import React, { useState, useEffect } from 'react';
import {
  Image,
  ImageProps,
  Platform,
  View,
  StyleSheet,
  ActivityIndicator,
} from 'react-native';
import { BlurView } from 'expo-blur';
import * as FileSystem from 'expo-file-system';
import { SHA256 } from 'crypto-js';

interface OptimizedImageProps extends Omit<ImageProps, 'source'> {
  uri: string;
  blurhash?: string;
  cacheKey?: string;
  lowQualityUri?: string;
}

const IMAGE_CACHE_DIR = `${FileSystem.cacheDirectory}images/`;

export function OptimizedImage({
  uri,
  blurhash,
  cacheKey,
  lowQualityUri,
  ...props
}: OptimizedImageProps) {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const [cachedUri, setCachedUri] = useState<string | null>(null);

  useEffect(() => {
    if (Platform.OS === 'web') return;

    const setupCache = async () => {
      try {
        const dirInfo = await FileSystem.getInfoAsync(IMAGE_CACHE_DIR);
        if (!dirInfo.exists) {
          await FileSystem.makeDirectoryAsync(IMAGE_CACHE_DIR, { intermediates: true });
        }
      } catch (err) {
        console.error('Error setting up image cache:', err);
      }
    };

    setupCache();
  }, []);

  useEffect(() => {
    if (Platform.OS === 'web') return;

    const cacheImage = async () => {
      try {
        const hash = cacheKey || SHA256(uri).toString();
        const ext = uri.split('.').pop() || 'jpg';
        const cachedPath = `${IMAGE_CACHE_DIR}${hash}.${ext}`;

        const fileInfo = await FileSystem.getInfoAsync(cachedPath);
        if (fileInfo.exists) {
          setCachedUri(fileInfo.uri);
          setLoading(false);
          return;
        }

        const { uri: downloadedUri } = await FileSystem.downloadAsync(
          uri,
          cachedPath
        );

        setCachedUri(downloadedUri);
        setLoading(false);
      } catch (err) {
        console.error('Error caching image:', err);
        setError(err as Error);
        setLoading(false);
      }
    };

    cacheImage();
  }, [uri, cacheKey]);

  if (Platform.OS === 'web') {
    return (
      <Image
        {...props}
        source={{ uri }}
        onLoadStart={() => setLoading(true)}
        onLoadEnd={() => setLoading(false)}
        onError={(err) => setError(err.nativeEvent.error)}
      />
    );
  }

  return (
    <View style={[styles.container, props.style]}>
      {lowQualityUri && (
        <Image
          source={{ uri: lowQualityUri }}
          style={[StyleSheet.absoluteFill, { opacity: loading ? 1 : 0 }]}
          blurRadius={3}
        />
      )}
      
      {blurhash && !lowQualityUri && loading && (
        <BlurView
          intensity={50}
          style={StyleSheet.absoluteFill}
          tint="light"
        />
      )}

      {cachedUri && (
        <Image
          {...props}
          source={{ uri: cachedUri }}
          onLoadStart={() => setLoading(true)}
          onLoadEnd={() => setLoading(false)}
          onError={(err) => setError(err.nativeEvent.error)}
          style={[
            props.style,
            { opacity: loading ? 0 : 1 },
          ]}
        />
      )}

      {loading && (
        <ActivityIndicator
          style={StyleSheet.absoluteFill}
          color="#0ea5e9"
        />
      )}

      {error && !loading && (
        <View style={[StyleSheet.absoluteFill, styles.errorContainer]}>
          <Image
            source={require('@/assets/image-error.png')}
            style={styles.errorIcon}
          />
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    overflow: 'hidden',
  },
  errorContainer: {
    backgroundColor: '#f5f5f5',
    justifyContent: 'center',
    alignItems: 'center',
  },
  errorIcon: {
    width: 24,
    height: 24,
    tintColor: '#666',
  },
});
