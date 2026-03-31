// Web Bluetooth API para coletar FC
// Note: Essa API só funciona no Chrome/Edge em desktops e Chrome no Android.
// Em iOS (Safari), não é suportada nativamente sem apps de terceiros (como Bluefy).

export async function connectHeartRateMonitor(
  onHeartRate: (bpm: number) => void,
  onDisconnect: () => void
): Promise<BluetoothDevice | null> {
  if (typeof navigator === "undefined" || !('bluetooth' in navigator)) {
    alert('Web Bluetooth não suportado neste navegador. Use Chrome no Android ou desktop.')
    return null
  }

  try {
    const device = await navigator.bluetooth.requestDevice({
      filters: [{ services: ['heart_rate'] }],
      optionalServices: ['battery_service'],
    })

    const server = await device.gatt!.connect()
    const service = await server.getPrimaryService('heart_rate')
    const characteristic = await service.getCharacteristic('heart_rate_measurement')

    await characteristic.startNotifications()
    characteristic.addEventListener('characteristicvaluechanged', (event: Event) => {
      const target = event.target as BluetoothRemoteGATTCharacteristic
      const value = target.value!
      const flags = value.getUint8(0)
      const rate16Bits = flags & 0x1
      const heartRate = rate16Bits ? value.getUint16(1, true) : value.getUint8(1)
      onHeartRate(heartRate)
    })

    device.addEventListener('gattserverdisconnected', onDisconnect)
    return device
  } catch (err) {
    console.error('[Bluetooth] Erro:', err)
    return null
  }
}

export function disconnectDevice(device: BluetoothDevice | null) {
  device?.gatt?.disconnect()
}
