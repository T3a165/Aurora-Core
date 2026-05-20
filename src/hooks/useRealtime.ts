/**
 * Aurora Core — useRealtime Hook
 * Simulates live sensor data streams across all 7 cognitive layers.
 * In production: replace setInterval with WebSocket / SSE from ESP32 sensors.
 *
 * Layer coverage: L1 Bio Ingestion, L2 Signal Normalization
 */

import { useState, useEffect, useRef } from 'react'
import type { LiveMetrics } from '../types'
import { calcSystemScore } from '../utils/biometrics'

/** Clamp a value between min and max */
function clamp(v: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, v))
}

/** Add random noise to a value within a range */
function jitter(v: number, range: number): number {
  return v + (Math.random() - 0.5) * range
}

/** Initial baseline state — matches real Jamaica Beach, TX install */
const BASELINE: LiveMetrics = {
  load:           9.17,
  solar:          3.42,
  grid:           5.75,
  batterySoc:     74,
  batteryCurrent: -8.4,
  heartRate:      62,
  hrv:            48,
  spo2:           98.2,
  stress:         18,
  co2:            612,
  temp:           72.4,
  humidity:       48,
  pm25:           8,
  systemScore:    87,
  tick:           0,
}

/**
 * useRealtime — provides continuously updating live metrics.
 * @param intervalMs - update frequency in milliseconds (default: 2500)
 *
 * @example
 * const metrics = useRealtime()
 * // metrics.heartRate updates every 2.5s
 */
export function useRealtime(intervalMs = 2500): LiveMetrics {
  const [metrics, setMetrics] = useState<LiveMetrics>(BASELINE)
  const ref = useRef(metrics)
  ref.current = metrics

  useEffect(() => {
    const id = setInterval(() => {
      const p = ref.current
      const hour = new Date().getHours()

      // Solar follows daylight curve (7am–7pm)
      const solar = hour >= 7 && hour <= 19
        ? clamp(jitter(p.solar, 0.14), 0, 5.5)
        : 0

      const load           = clamp(jitter(p.load,           0.10), 6.0, 12.0)
      const grid           = clamp(load - solar,            0, 10)
      const batterySoc     = clamp(p.batterySoc + (Math.random() > 0.65 ? -0.08 : 0.03), 55, 98)
      const batteryCurrent = clamp(jitter(p.batteryCurrent, 0.4), -15, 8)
      const heartRate      = Math.round(clamp(jitter(p.heartRate, 1.5), 48, 82))
      const hrv            = Math.round(clamp(jitter(p.hrv,        2.0), 28, 75))
      const spo2           = +clamp(jitter(p.spo2,          0.12), 95, 99.9).toFixed(1)
      const stress         = Math.round(clamp(jitter(p.stress,     2.0), 5,  80))
      const co2            = Math.round(clamp(jitter(p.co2,        10),  380, 900))
      const temp           = +clamp(jitter(p.temp,           0.25), 65, 82).toFixed(1)
      const humidity       = +clamp(jitter(p.humidity,       0.6),  30, 70).toFixed(0)
      const pm25           = Math.round(clamp(jitter(p.pm25, 1.0),  2,  35))

      const systemScore = calcSystemScore(hrv, stress, batterySoc, solar, co2)

      setMetrics({
        load:           +load.toFixed(2),
        solar:          +solar.toFixed(2),
        grid:           +grid.toFixed(2),
        batterySoc:     +batterySoc.toFixed(1),
        batteryCurrent: +batteryCurrent.toFixed(1),
        heartRate,
        hrv,
        spo2,
        stress,
        co2,
        temp,
        humidity,
        pm25,
        systemScore,
        tick: p.tick + 1,
      })
    }, intervalMs)

    return () => clearInterval(id)
  }, [intervalMs])

  return metrics
}
