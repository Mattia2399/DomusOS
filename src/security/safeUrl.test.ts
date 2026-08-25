import { describe, expect, it } from 'vitest';
import { sanitizeDynamicUrl } from './safeUrl';

describe('dynamic URL sanitizer', () => {
  it('rejects executable protocols and credentials', () => {
    expect(sanitizeDynamicUrl('javascript:alert(1)', 'link')).toBeUndefined();
    expect(sanitizeDynamicUrl('https://user:pass@example.test/image.jpg', 'image')).toBeUndefined();
    expect(sanitizeDynamicUrl('data:text/html,<script>alert(1)</script>', 'image')).toBeUndefined();
  });

  it('limits HA resources to the configured origin', () => {
    expect(sanitizeDynamicUrl('/api/camera_proxy/camera.front', 'image', {
      baseUrl: 'https://ha.example.test/', allowedOrigins: ['https://ha.example.test'],
    })).toBe('https://ha.example.test/api/camera_proxy/camera.front');
    expect(sanitizeDynamicUrl('https://evil.example/image.jpg', 'image', {
      baseUrl: 'https://ha.example.test/', allowedOrigins: ['https://ha.example.test'],
    })).toBeUndefined();
  });
});
