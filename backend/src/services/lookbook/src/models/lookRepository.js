const looks = [
  {
    id: 'rompe-el-molde',
    title: 'Rompe el molde',
    description: 'Camiseta negra de corte amplio con el logo de INKRIOT estampado en blanco y rojo.',
    imageUrl: '/lookbook/rompe-el-molde.webp',
    imageAlt: 'Modelo con gafas oscuras y camiseta negra de INKRIOT en el cartel «Rompe el molde».',
    detail: { caption: 'Detalle del estampado', x: 4, y: 66 },
    position: 1,
    published: true,
  },
];

export const lookRepository = {
  async findAll() {
    return looks;
  },
};
