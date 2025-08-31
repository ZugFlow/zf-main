// Funzione di esempio per lo stile della card
export default function getModernCardStyle(cardType: string) {
  switch (cardType) {
    case 'filled':
      return { background: '#e0e0e0', color: '#333' };
    case 'top':
      return { borderTop: '4px solid #3b82f6' };
    case 'bottom':
      return { borderBottom: '4px solid #3b82f6' };
    case 'left':
      return { borderLeft: '4px solid #3b82f6' };
    case 'right':
      return { borderRight: '4px solid #3b82f6' };
    default:
      return { background: '#fff', color: '#333' };
  }
}
