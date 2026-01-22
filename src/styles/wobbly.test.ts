import { wobbly, wobblyStyle, getVariedWobbly } from './wobbly'

describe('Wobbly Border Utilities', () => {
  describe('wobbly presets', () => {
    it('should have all size presets', () => {
      expect(wobbly.sm).toBeDefined()
      expect(wobbly.md).toBeDefined()
      expect(wobbly.lg).toBeDefined()
      expect(wobbly.xl).toBeDefined()
      expect(wobbly.pill).toBeDefined()
      expect(wobbly.circle).toBeDefined()
      expect(wobbly.blob).toBeDefined()
    })

    it('should use elliptical border-radius format (with slash)', () => {
      // Elliptical format uses / to separate horizontal and vertical radii
      expect(wobbly.sm).toContain('/')
      expect(wobbly.md).toContain('/')
      expect(wobbly.lg).toContain('/')
    })

    it('should NOT use standard rounded values', () => {
      // Should not be simple values like "8px" or "1rem"
      Object.values(wobbly).forEach((value) => {
        expect(value).not.toMatch(/^\d+px$/)
        expect(value).not.toMatch(/^\d+rem$/)
      })
    })

    it('should have asymmetric values for hand-drawn feel', () => {
      // Each corner should have different values
      const smValues = wobbly.sm.split(' ')
      const uniqueValues = new Set(smValues.filter((v) => v !== '/'))
      // Should have multiple unique values (not all the same)
      expect(uniqueValues.size).toBeGreaterThan(1)
    })
  })

  describe('wobblyStyle objects', () => {
    it('should provide style objects with borderRadius', () => {
      expect(wobblyStyle.sm.borderRadius).toBe(wobbly.sm)
      expect(wobblyStyle.md.borderRadius).toBe(wobbly.md)
      expect(wobblyStyle.lg.borderRadius).toBe(wobbly.lg)
    })
  })

  describe('getVariedWobbly', () => {
    it('should return the base wobbly value', () => {
      expect(getVariedWobbly('sm')).toBe(wobbly.sm)
      expect(getVariedWobbly('md')).toBe(wobbly.md)
    })

    it('should default to md size', () => {
      expect(getVariedWobbly()).toBe(wobbly.md)
    })
  })
})
