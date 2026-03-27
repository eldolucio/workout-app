"use client";


type AnimationType = 'Puxada Frente' | 'Supino Reto' | 'Agachamento' | 'Rosca Direta' | 'Remada Curvada' | 'Desenvolvimento' | string;

interface Props {
  name: AnimationType;
}

const styles = {
  container: {
    display: 'flex',
    flexDirection: 'column' as const,
    alignItems: 'center',
    padding: '2rem',
    background: '#161616',
    borderRadius: '14px',
    border: '1px solid #222',
    width: '100%',
    maxWidth: '320px',
    margin: '0 auto',
  },
  svg: {
    width: '160px',
    height: '230px',
    overflow: 'visible',
  },
  label: {
    marginTop: '1.5rem',
    fontSize: '0.875rem',
    color: '#c8f135',
    fontFamily: 'Barlow Condensed',
    fontWeight: 700,
    textTransform: 'uppercase' as const,
    letterSpacing: '0.05em',
  },
  tip: {
    marginTop: '0.5rem',
    fontSize: '0.75rem',
    color: '#555',
    textAlign: 'center' as const,
    fontFamily: 'Barlow',
  }
};

const keyframes = `
  @keyframes pull { 0%, 100% { transform: translateY(0); } 50% { transform: translateY(40px); } }
  @keyframes press { 0%, 100% { transform: translateY(0); } 50% { transform: translateY(-50px); } }
  @keyframes squat { 0%, 100% { transform: translateY(0) scaleY(1); } 50% { transform: translateY(30px) scaleY(0.7); } }
  @keyframes curl { 0%, 100% { transform: rotate(0deg); } 50% { transform: rotate(-100deg); } }
  @keyframes row { 0%, 100% { transform: translate(0, 0); } 50% { transform: translate(-20px, -20px); } }
  @keyframes overhead { 0%, 100% { transform: translateY(0); } 50% { transform: translateY(-60px); } }
`;

export default function ExerciseAnimation({ name }: Props) {
  let content = null;
  let phaseLabel = "";
  let tip = "";

  const limbColor = "#e8e8e8";
  const activeColor = "#c8f135";

  if (name.toLowerCase().includes('puxada')) {
    phaseLabel = "Puxar até o queixo";
    tip = "Mantenha o peito aberto e os cotovelos para baixo.";
    content = (
      <g style={{ animation: 'pull 1.8s ease-in-out infinite' }}>
        {/* Torso */}
        <rect x="75" y="100" width="10" height="50" rx="5" fill={limbColor} />
        {/* Arms */}
        <path d="M40 60 L75 100 M120 60 L85 100" stroke={limbColor} strokeWidth="6" strokeLinecap="round" />
        {/* Bar */}
        <rect x="30" y="55" width="100" height="6" rx="3" fill={activeColor} />
      </g>
    );
  } else if (name.toLowerCase().includes('supino')) {
    phaseLabel = "Empurre com explosão";
    tip = "Escápulas retraídas e pés firmes no chão.";
    content = (
      <g style={{ animation: 'press 1.8s ease-in-out infinite' }}>
         {/* Bar */}
         <rect x="30" y="120" width="100" height="6" rx="3" fill={activeColor} />
         {/* Hands/Forearms */}
         <path d="M50 125 L50 160 M110 125 L110 160" stroke={limbColor} strokeWidth="6" strokeLinecap="round" />
      </g>
    );
  } else if (name.toLowerCase().includes('agachamento')) {
    phaseLabel = "Desça até 90 graus";
    tip = "Calcanhares colados no chão, foco no quadril.";
    content = (
      <g style={{ animation: 'squat 1.8s ease-in-out infinite', transformOrigin: 'center bottom' }}>
         {/* Torso */}
         <rect x="75" y="80" width="10" height="60" rx="5" fill={limbColor} />
         {/* Legs */}
         <path d="M75 140 L60 180 L60 220 M85 140 L100 180 L100 220" stroke={limbColor} strokeWidth="8" fill="none" strokeLinejoin="round" />
         {/* Bar on back */}
         <rect x="40" y="85" width="80" height="6" rx="3" fill={activeColor} />
      </g>
    );
  } else if (name.toLowerCase().includes('rosca')) {
    phaseLabel = "Contraia o bíceps";
    tip = "Cotovelos travados na lateral do corpo.";
    content = (
      <g>
        {/* Torso */}
        <rect x="75" y="80" width="10" height="80" rx="5" fill={limbColor} />
        {/* Upper Arm */}
        <line x1="80" y1="90" x2="80" y2="130" stroke={limbColor} strokeWidth="6" />
        {/* Lower Arm & Dumbbell */}
        <g style={{ transformOrigin: '80px 130px', animation: 'curl 1.8s ease-in-out infinite' }}>
          <line x1="80" y1="130" x2="110" y2="130" stroke={activeColor} strokeWidth="6" strokeLinecap="round" />
          <circle cx="110" cy="130" r="8" fill={activeColor} />
        </g>
      </g>
    );
  } else if (name.toLowerCase().includes('remada')) {
    phaseLabel = "Puxe em direção ao umbigo";
    tip = "Tronco inclinado, puxe com o cotovelo.";
    content = (
      <g style={{ transform: 'rotate(20deg)', transformOrigin: 'center' }}>
        {/* Torso */}
        <rect x="75" y="80" width="10" height="70" rx="5" fill={limbColor} />
        {/* Arms pulling */}
        <g style={{ animation: 'row 1.8s ease-in-out infinite' }}>
          <path d="M80 100 L110 130" stroke={limbColor} strokeWidth="6" strokeLinecap="round" />
          <rect x="100" y="125" width="30" height="6" rx="3" fill={activeColor} />
        </g>
      </g>
    );
  } else if (name.toLowerCase().includes('desenvolvimento')) {
     phaseLabel = "Extensão total acima da cabeça";
     tip = "Cuidado para não arquear demais a lombar.";
     content = (
       <g style={{ animation: 'overhead 1.8s ease-in-out infinite' }}>
          {/* Bar */}
          <rect x="30" y="80" width="100" height="6" rx="3" fill={activeColor} />
          {/* Torso */}
          <rect x="75" y="120" width="10" height="60" rx="5" fill={limbColor} />
       </g>
     );
  } else {
    phaseLabel = name;
    tip = "Foco na execução e respiração.";
    content = <circle cx="80" cy="115" r="30" fill={activeColor} opacity="0.5" />;
  }

  return (
    <div style={styles.container}>
      <style>{keyframes}</style>
      <svg viewBox="0 0 160 230" style={styles.svg}>
        <rect width="160" height="230" fill="transparent" />
        {content}
      </svg>
      <span style={styles.label}>{phaseLabel}</span>
      <p style={styles.tip}>{tip}</p>
    </div>
  );
}
