// El administrador también tiene todo lo de un vendedor.
export const isSeller = (profile) => profile?.role === 'seller' || profile?.role === 'admin';
export const isAdmin = (profile) => profile?.role === 'admin';
