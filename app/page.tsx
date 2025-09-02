import Link from 'next/link';
import { Button } from '@/components/ui/button';

export default function Home() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="text-center max-w-md mx-auto px-4">
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">NutriFlow</h1>
          <p className="text-lg text-gray-600 mb-8">
            Plataforma completa para gestão nutricional
          </p>
        </div>
        
        <div className="space-y-4">
          <Link href="/login" className="block">
            <Button className="w-full" size="lg">
              Fazer Login
            </Button>
          </Link>
          
          <Link href="/signup" className="block">
            <Button variant="outline" className="w-full" size="lg">
              Criar Conta
            </Button>
          </Link>
        </div>
        
        <div className="mt-8 text-sm text-gray-500">
          <p>Gerencie pacientes, consultas, planos alimentares e muito mais</p>
        </div>
      </div>
    </div>
  );
}