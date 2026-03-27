export default function ErrorMessage({ message }: { message: string }) {
  if (!message) return null
  
  return (
    <div style={{
      background: '#2a0a0a',
      color: '#ff4d4f',
      padding: '1rem',
      borderRadius: '8px',
      border: '1px solid #ff4d4f',
      fontFamily: 'Barlow',
      fontSize: '0.875rem',
      marginTop: '1rem',
      marginBottom: '1rem'
    }}>
      <strong>Erro:</strong> {message}
    </div>
  )
}
