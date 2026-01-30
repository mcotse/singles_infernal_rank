/**
 * Performance Timing Utility
 *
 * Simple utility for measuring and logging performance of operations.
 * Used to identify bottlenecks in image loading and first-launch time.
 */

class PerfTiming {
  private marks: Map<string, number> = new Map()

  /**
   * Record a timestamp for a named mark
   */
  mark(name: string): void {
    this.marks.set(name, performance.now())
  }

  /**
   * Measure duration between a start mark and now, log to console
   * @returns Duration in milliseconds
   */
  measure(name: string, startMark: string): number {
    const startTime = this.marks.get(startMark)
    if (startTime === undefined) {
      console.warn(`[Perf] Start mark "${startMark}" not found`)
      return -1
    }

    const duration = performance.now() - startTime
    console.log(`[Perf] ${name}: ${duration.toFixed(1)}ms`)
    return duration
  }

  /**
   * Clear a specific mark
   */
  clearMark(name: string): void {
    this.marks.delete(name)
  }

  /**
   * Clear all marks
   */
  clearAll(): void {
    this.marks.clear()
  }
}

export const perfTiming = new PerfTiming()
