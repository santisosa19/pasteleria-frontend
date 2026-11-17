# Pasteleria Frontend

Frontend React para la gestion interna de la pasteleria.

## Stack

- React
- TypeScript
- Vite

## Scripts

- `npm run dev`: servidor local.
- `npm run build`: build de produccion.
- `npm run lint`: lint del proyecto.
- `npm run preview`: previsualizacion del build.
- `node --test test/suggestedPrice.check.mjs`: pruebas de precio sugerido.

## Costo y precio

Al editar o crear un producto con receta, se puede calcular el precio sugerido
aplicando un recargo al costo por unidad de rendimiento (por ejemplo, $1.000
mas 30% da $1.300). Requiere el permiso `recipes:cost:read`. El recargo es
solo un calculo: **Usar precio** completa el campo de precio de venta y el
producto solo cambia al guardar. Si algun ingrediente no tiene costo, el
sistema no muestra un precio sugerido.

## URLs

- Frontend local: `http://localhost:5173`
- Backend esperado: `http://localhost:3000`
- Swagger: `http://localhost:3000/docs`
