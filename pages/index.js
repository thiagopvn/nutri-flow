import Link from 'next/link';

export default function Home() {
  return (
    <div style={{
      minHeight: '100vh',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: '#f9fafb',
      fontFamily: 'system-ui, sans-serif'
    }}>
      <div style={{
        textAlign: 'center',
        maxWidth: '400px',
        padding: '20px'
      }}>
        <h1 style={{
          fontSize: '3rem',
          fontWeight: 'bold',
          marginBottom: '1rem',
          color: '#111827'
        }}>
          NutriFlow
        </h1>
        <p style={{
          fontSize: '1.2rem',
          color: '#6b7280',
          marginBottom: '2rem'
        }}>
          Plataforma completa para gestão nutricional
        </p>
        
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          <Link href="/login" style={{
            display: 'block',
            padding: '12px 24px',
            backgroundColor: '#10b981',
            color: 'white',
            textDecoration: 'none',
            borderRadius: '8px',
            fontWeight: '500'
          }}>
            Fazer Login
          </Link>
          
          <Link href="/signup" style={{
            display: 'block',
            padding: '12px 24px',
            backgroundColor: 'white',
            color: '#10b981',
            textDecoration: 'none',
            borderRadius: '8px',
            border: '1px solid #10b981',
            fontWeight: '500'
          }}>
            Criar Conta
          </Link>
        </div>
        
        <p style={{
          fontSize: '0.9rem',
          color: '#9ca3af',
          marginTop: '2rem'
        }}>
          Gerencie pacientes, consultas, planos alimentares e muito mais
        </p>
      </div>
    </div>
  );
}