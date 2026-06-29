import {
  cotizarAgendasCuadernos,
  cotizarBajadaV2,
  cotizarCarpetas,
  cotizarFolletos,
  cotizarImanesCorteRecto,
  cotizarPlanchaImanImpreso,
  cotizarSobres,
  cotizarStickersCirculares,
  cotizarStickersCorteRecto,
  cotizarTarjetas9x5,
  cotizarTarjetasPostales,
  cotizarTarjetasTroqueladasCirculares,
} from "../api/bajadasV2Api";

const FOLLETOS_PAPELES = [
  { papel: "150g Ilustracion", gramaje: "150g" },
  { papel: "80g Ilustracion", gramaje: "80g" },
];

const CARPETAS_PAPEL = "300g Ilustracion";
const CARPETAS_GRAMAJE = "300g";
const KRAFT_TIPO_PAPEL = "kraft";
const KRAFT_MATERIAL = "Kraft";

export function buildTarjetasPayload(form, inferred, derivedRange, cantidadUnidades) {
  if (inferred.categoria === "Tarjetas Postales") {
    return {
      categoria: "Tarjetas Postales",
      producto: "postal",
      formato: "postal",
      papel: `${form.gramaje_tarjetas} Ilustracion`,
      gramaje: form.gramaje_tarjetas,
      terminacion: form.terminacion_tarjetas,
      caras: inferred.caras,
      cantidad_unidades: cantidadUnidades,
      terminaciones_extra: {
        puntas_redondeadas: false,
        agujerado: false,
      },
      urgencia: form.urgencia,
    };
  }

  if (inferred.categoria === "Tarjetas Troqueladas Circulares") {
    return {
      categoria: "Tarjetas Troqueladas Circulares",
      producto: "tarjeta_troquelada_circular",
      formato: form.formato,
      caras: form.caras_tarjetas_troq_circ,
      adicional_laminado: form.adicional_laminado_troq_circ,
      caras_adicional_laminado: Number(form.caras_adicional_troq_circ || 0),
      cantidad_unidades: cantidadUnidades,
      urgencia: form.urgencia,
    };
  }

  return {
    categoria: "Tarjetas Personales",
    producto: "9x5",
    formato: "9x5",
    papel: `${form.gramaje_tarjetas} Ilustracion`,
    gramaje: form.gramaje_tarjetas,
    terminacion: form.terminacion_tarjetas,
    caras: inferred.caras,
    cantidad_unidades: cantidadUnidades,
    terminaciones_extra: {
      puntas_redondeadas: false,
      agujerado: false,
    },
    urgencia: form.urgencia,
  };
}

export function buildFolletosPayload(form, inferred, derivedRange, cantidadUnidades) {
  return {
    categoria: "Folletos",
    producto: "folleto",
    formato: form.formato,
    papel: form.papel_folleto,
    gramaje: FOLLETOS_PAPELES.find((p) => p.papel === form.papel_folleto)?.gramaje || "150g",
    modo_color: form.modo_color_folleto,
    caras: inferred.caras,
    cantidad_unidades: cantidadUnidades,
    urgencia: form.urgencia,
  };
}

export function buildCarpetasPayload(form, inferred, derivedRange, cantidadUnidades) {
  return {
    categoria: "Carpetas",
    producto: "carpeta_a4",
    formato: "A4",
    papel: CARPETAS_PAPEL,
    gramaje: CARPETAS_GRAMAJE,
    terminacion: form.terminacion_carpetas,
    caras: inferred.caras,
    cantidad_unidades: cantidadUnidades,
    solapa_impresa: Boolean(form.solapa_impresa),
    urgencia: form.urgencia,
  };
}

export function buildSobresPayload(form, inferred, derivedRange, cantidadUnidades) {
  return {
    categoria: "Sobres",
    producto: "sobre",
    tipo_sobre: form.tipo_sobre,
    papel: "63g",
    color: "blanco",
    caras: "4/0",
    cantidad_unidades: cantidadUnidades,
    urgencia: form.urgencia,
  };
}

export function buildStickersPayload(form, inferred, derivedRange, cantidadUnidades) {
  if (inferred.categoria === "Stickers Circulares") {
    return {
      categoria: "Stickers Circulares",
      producto: "sticker_circular",
      material: form.material_stickers_circulares,
      formato: form.formato,
      terminacion: form.terminacion_stickers_circulares,
      cantidad_unidades: cantidadUnidades,
      urgencia: form.urgencia,
    };
  }

  return {
    categoria: "Stickers Corte Recto",
    producto: "sticker_corte_recto",
    formato: form.formato,
    terminacion: form.terminacion_stickers,
    cantidad_unidades: cantidadUnidades,
    urgencia: form.urgencia,
  };
}

export function buildImanesPayload(form, inferred, derivedRange, cantidadUnidades) {
  if (inferred.categoria === "Plancha de Imán Impreso") {
    return {
      categoria: "Plancha de Imán Impreso",
      producto: "plancha_iman_impreso",
      variante: form.variante_plancha_iman,
      cantidad_unidades: cantidadUnidades,
      urgencia: form.urgencia,
    };
  }

  return {
    categoria: "Imanes Corte Recto",
    producto: "iman_corte_recto",
    formato: form.formato,
    papel: "300g Ilustracion",
    gramaje: "300g",
    terminacion: form.terminacion_imanes,
    cantidad_unidades: cantidadUnidades,
    urgencia: form.urgencia,
  };
}

export function buildAgendasPayload(form, inferred, derivedRange, cantidadUnidades) {
  return {
    categoria: "Agendas / Cuadernos",
    producto: form.producto_agendas,
    formato: form.formato_agendas,
    paginas: Number(form.paginas_agendas),
    cantidad_unidades: cantidadUnidades,
    urgencia: form.urgencia,
  };
}

export function buildBajadasPayload(form, inferred, derivedRange, cantidadUnidades) {
  const isAutoadhesivas = inferred.categoria === "Bajadas Autoadhesivas";
  const isKraft = inferred.categoria === "Bajadas Kraft";

  return {
    categoria: inferred.categoria,
    modo_color: inferred.modo_color,
    formato: inferred.formato,
    tipo_papel: isAutoadhesivas ? form.columna_precio : (isKraft ? KRAFT_TIPO_PAPEL : form.tipo_papel),
    material: isAutoadhesivas ? (form.columna_precio === "especial" ? "OPP blanco" : "Sticker") : (isKraft ? KRAFT_MATERIAL : form.material),
    gramaje: isAutoadhesivas ? "N/A" : (isKraft ? form.gramaje : form.gramaje),
    cantidad_unidades: cantidadUnidades,
    cantidad_rango: derivedRange,
    caras: inferred.caras,
    urgencia: form.urgencia,
    adicional_laminado: form.adicional_laminado || "sin_adicional",
    caras_adicional_laminado:
      !isAutoadhesivas && ["laca", "laminado_brillo", "laminado_mate"].includes(form.adicional_laminado)
        ? Number(form.caras_adicional_laminado || 1)
        : 1,
    adicional_laminado_por_lado:
      !isAutoadhesivas && (inferred.formato === "A3+" || inferred.formato === "XA3")
        ? (form.adicional_laminado_por_lado || "sin_adicional")
        : "sin_adicional",
    adicional_plastificado:
      !isAutoadhesivas && (inferred.formato === "A3+" || inferred.formato === "XA3")
        ? Boolean(form.adicional_plastificado)
        : false,
    adicional_tinta_blanca: isAutoadhesivas ? Boolean(form.adicional_tinta_blanca) : false,
    adicional_laca_uv: isAutoadhesivas ? Boolean(form.adicional_laca_uv) : false,
    adicional_troquelado: Boolean(form.adicional_troquelado),
    complejidad_troquelado: form.adicional_troquelado ? form.complejidad_troquelado : undefined,
    tipo_producto: isAutoadhesivas ? "autoadhesiva" : undefined,
    columna_precio: isAutoadhesivas ? form.columna_precio : undefined,
  };
}

export function dispatchCotizacion(productKey, payload) {
  if (productKey === "tarjetas_9x5") return cotizarTarjetas9x5(payload);
  if (productKey === "tarjetas_postales") return cotizarTarjetasPostales(payload);
  if (productKey === "folletos") return cotizarFolletos(payload);
  if (productKey === "carpetas") return cotizarCarpetas(payload);
  if (productKey === "sobres") return cotizarSobres(payload);
  if (productKey === "stickers_corte_recto") return cotizarStickersCorteRecto(payload);
  if (productKey === "imanes_corte_recto") return cotizarImanesCorteRecto(payload);
  if (productKey === "stickers_circulares") return cotizarStickersCirculares(payload);
  if (productKey === "tarjetas_troqueladas_circulares") return cotizarTarjetasTroqueladasCirculares(payload);
  if (productKey === "plancha_iman_impreso") return cotizarPlanchaImanImpreso(payload);
  if (productKey === "agendas_cuadernos") return cotizarAgendasCuadernos(payload);
  return cotizarBajadaV2(payload);
}
