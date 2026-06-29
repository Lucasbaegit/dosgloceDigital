import { useEffect, useMemo, useState } from "react";
import optionRows from "../data/bajadasOptions.json";
import {
  deriveRangeFromQuantity,
  inferQuoteContext,
  uniqueSorted,
} from "../lib/cotizacionLogic";

export default function useCotizacionForm({
  initialForm,
  setResult,
  setLastPayload,
  setError,
  setCopyStatus,
  setLoading,
  constants,
}) {
  const {
    ADICIONALES,
    ADICIONALES_LIVIANO,
    AGENDAS_FORMATOS,
    AGENDAS_PAGINAS,
    AGENDAS_PRODUCTOS,
    AUTOADH_FORMATOS,
    AUTOADH_RANGOS,
    CARAS,
    CARPETAS_CARAS,
    CARPETAS_FORMATOS,
    CARPETAS_GRAMAJE,
    CARPETAS_PAPEL,
    CARPETAS_RANGOS,
    CARPETAS_TERMINACIONES,
    FOLLETOS_CANTIDADES,
    FOLLETOS_FORMATOS,
    FOLLETOS_MODO_COLOR,
    FOLLETOS_PAPELES,
    IMANES_CANTIDADES,
    IMANES_FORMATOS,
    IMANES_TERMINACIONES,
    KRAFT_FORMATOS,
    KRAFT_GRAMAJES,
    KRAFT_MATERIAL,
    KRAFT_RANGOS,
    KRAFT_TIPO_PAPEL,
    PLANCHA_IMAN_CANTIDADES_SUGERIDAS,
    PLANCHA_IMAN_VARIANTES,
    POSTALES_CANTIDADES,
    POSTALES_CARAS,
    POSTALES_FORMATOS,
    POSTALES_GRAMAJES,
    POSTALES_TERMINACIONES,
    SOBRES_CANTIDADES,
    SOBRES_TIPOS,
    STICKERS_CANTIDADES,
    STICKERS_CIRCULARES_CANTIDADES,
    STICKERS_CIRCULARES_FORMATOS,
    STICKERS_CIRCULARES_MATERIALES,
    STICKERS_CIRCULARES_TERMINACIONES,
    STICKERS_FORMATOS,
    STICKERS_TERMINACIONES,
    TARJETAS_CANTIDADES,
    TARJETAS_CARAS,
    TARJETAS_FORMATOS,
    TARJETAS_GRAMAJES,
    TARJETAS_TERMINACIONES,
    TARJETAS_TROQ_CIRC_CANTIDADES,
    TARJETAS_TROQ_CIRC_FORMATOS,
  } = constants;

  const [form, setForm] = useState(initialForm);

  const inferred = useMemo(() => inferQuoteContext(form), [form, inferQuoteContext]);
  const isAutoadhesivas = inferred.categoria === "Bajadas Autoadhesivas";
  const isKraft = inferred.categoria === "Bajadas Kraft";
  const isTarjetas = inferred.categoria === "Tarjetas Personales";
  const isPostales = inferred.categoria === "Tarjetas Postales";
  const isFolletos = inferred.categoria === "Folletos";
  const isCarpetas = inferred.categoria === "Carpetas";
  const isSobres = inferred.categoria === "Sobres";
  const isStickers = inferred.categoria === "Stickers Corte Recto";
  const isImanes = inferred.categoria === "Imanes Corte Recto";
  const isStickersCirculares = inferred.categoria === "Stickers Circulares";
  const isTarjetasTroqCirc = inferred.categoria === "Tarjetas Troqueladas Circulares";
  const isPlanchaIman = inferred.categoria === "Plancha de Imán Impreso";
  const isAgendasCuadernos = inferred.categoria === "Agendas / Cuadernos";
  const isNoRangeProduct = isPlanchaIman || isAgendasCuadernos;
  const isBajadasFlow = inferred.categoria.startsWith("Bajadas");
  const isMatrixProduct =
    isTarjetas || isPostales || isFolletos || isSobres || isStickers || isImanes || isStickersCirculares || isTarjetasTroqCirc;
  const isLivianoBajadaNoAutoadhesiva =
    (inferred.categoria === "Bajadas Fullcolor" || inferred.categoria === "Bajadas Blanco y Negro") &&
    String(form.tipo_papel || "").toLowerCase() === "liviano";
  const adicionalesDisponibles = useMemo(() => {
    if (!isBajadasFlow) return ADICIONALES;
    if (isAutoadhesivas) return ADICIONALES_LIVIANO;
    if (isLivianoBajadaNoAutoadhesiva) return ADICIONALES_LIVIANO;
    return ADICIONALES;
  }, [ADICIONALES, ADICIONALES_LIVIANO, isBajadasFlow, isAutoadhesivas, isLivianoBajadaNoAutoadhesiva]);
  const formatoDataSource = useMemo(() => {
    if (isKraft || isTarjetas || isPostales || isFolletos || isCarpetas || isSobres || isStickers || isImanes || isStickersCirculares || isTarjetasTroqCirc || isPlanchaIman || isAgendasCuadernos) return form.formato;
    if (form.formato === "XA3") return "A3+";
    return form.formato;
  }, [form.formato, isKraft, isTarjetas, isPostales, isFolletos, isCarpetas, isSobres, isStickers, isImanes, isStickersCirculares, isTarjetasTroqCirc, isPlanchaIman, isAgendasCuadernos]);

  const validRows = useMemo(
    () =>
      optionRows.filter(
        (r) => r.categoria === inferred.categoria && r.modo_color === inferred.modo_color && r.caras === inferred.caras
      ),
    [inferred]
  );
  const formatoOptions = useMemo(() => uniqueSorted(validRows.map((r) => r.formato)), [validRows]);
  const effectiveFormatoOptions = useMemo(() => {
    if (isKraft) return KRAFT_FORMATOS;
    if (isTarjetas) return TARJETAS_FORMATOS;
    if (isPostales) return POSTALES_FORMATOS;
    if (isFolletos) return FOLLETOS_FORMATOS;
    if (isCarpetas) return CARPETAS_FORMATOS;
    if (isSobres) return ["sobre"];
    if (isStickers) return STICKERS_FORMATOS;
    if (isImanes) return IMANES_FORMATOS;
    if (isStickersCirculares) return STICKERS_CIRCULARES_FORMATOS;
    if (isTarjetasTroqCirc) return TARJETAS_TROQ_CIRC_FORMATOS;
    if (isPlanchaIman) return ["30x46"];
    if (isAgendasCuadernos) return AGENDAS_FORMATOS;
    if (isAutoadhesivas) return AUTOADH_FORMATOS;
    if (formatoOptions.includes("A3+") && !formatoOptions.includes("XA3")) {
      return uniqueSorted([...formatoOptions, "XA3"]);
    }
    return formatoOptions;
  }, [AGENDAS_FORMATOS, AUTOADH_FORMATOS, CARPETAS_FORMATOS, FOLLETOS_FORMATOS, IMANES_FORMATOS, KRAFT_FORMATOS, POSTALES_FORMATOS, STICKERS_CIRCULARES_FORMATOS, STICKERS_FORMATOS, TARJETAS_FORMATOS, TARJETAS_TROQ_CIRC_FORMATOS, isAutoadhesivas, isKraft, isTarjetas, isPostales, isFolletos, isCarpetas, isSobres, isStickers, isImanes, isStickersCirculares, isTarjetasTroqCirc, isPlanchaIman, isAgendasCuadernos, formatoOptions]);
  const tipoPapelOptions = useMemo(
    () => uniqueSorted(validRows.filter((r) => r.formato === formatoDataSource).map((r) => r.tipo_papel)),
    [validRows, formatoDataSource]
  );
  const materialOptions = useMemo(
    () => uniqueSorted(validRows.filter((r) => r.formato === formatoDataSource && r.tipo_papel === form.tipo_papel).map((r) => r.material)),
    [validRows, formatoDataSource, form.tipo_papel]
  );
  const gramajeOptions = useMemo(
    () =>
      uniqueSorted(
        validRows
          .filter((r) => r.formato === formatoDataSource && r.tipo_papel === form.tipo_papel && r.material === form.material)
          .map((r) => r.gramaje)
      ),
    [validRows, formatoDataSource, form.tipo_papel, form.material]
  );
  const cantidadOptions = useMemo(() => {
    if (isKraft) return KRAFT_RANGOS;
    if (isTarjetas) return TARJETAS_CANTIDADES;
    if (isPostales) return POSTALES_CANTIDADES;
    if (isFolletos) return FOLLETOS_CANTIDADES;
    if (isCarpetas) return CARPETAS_RANGOS;
    if (isSobres) return SOBRES_CANTIDADES;
    if (isStickers) return STICKERS_CANTIDADES;
    if (isImanes) return IMANES_CANTIDADES;
    if (isStickersCirculares) return STICKERS_CIRCULARES_CANTIDADES;
    if (isTarjetasTroqCirc) return TARJETAS_TROQ_CIRC_CANTIDADES;
    if (isPlanchaIman) return PLANCHA_IMAN_CANTIDADES_SUGERIDAS;
    if (isAgendasCuadernos) return ["2", "5", "10", "20"];
    if (isAutoadhesivas) return AUTOADH_RANGOS;
    return uniqueSorted(
      validRows
        .filter(
          (r) =>
            r.formato === formatoDataSource &&
            r.tipo_papel === form.tipo_papel &&
            r.material === form.material &&
            r.gramaje === form.gramaje
        )
        .map((r) => r.cantidad_rango)
    );
  }, [AUTOADH_RANGOS, CARPETAS_RANGOS, FOLLETOS_CANTIDADES, IMANES_CANTIDADES, KRAFT_RANGOS, PLANCHA_IMAN_CANTIDADES_SUGERIDAS, POSTALES_CANTIDADES, SOBRES_CANTIDADES, STICKERS_CANTIDADES, STICKERS_CIRCULARES_CANTIDADES, TARJETAS_CANTIDADES, TARJETAS_TROQ_CIRC_CANTIDADES, isKraft, isTarjetas, isPostales, isFolletos, isCarpetas, isSobres, isStickers, isImanes, isStickersCirculares, isTarjetasTroqCirc, isPlanchaIman, isAgendasCuadernos, isAutoadhesivas, validRows, formatoDataSource, form.tipo_papel, form.material, form.gramaje]);
  const cantidadUnidades = useMemo(() => Number(form.cantidad_unidades), [form.cantidad_unidades]);
  const derivedRange = useMemo(() => deriveRangeFromQuantity(cantidadUnidades, cantidadOptions), [cantidadUnidades, cantidadOptions]);

  useEffect(() => {
    setForm((prev) => {
      const next = { ...prev };
      if (next.categoria_ui === "Bajadas Autoadhesivas") {
        if (!AUTOADH_FORMATOS.includes(next.formato)) next.formato = "A3+";
        next.caras = "4/0";
        next.tipo_papel = next.columna_precio || "papel";
        next.material = next.columna_precio === "especial" ? "OPP blanco" : "Sticker";
        next.gramaje = next.columna_precio === "especial" ? "N/A" : "N/A";
        next.adicional_laminado_por_lado = "sin_adicional";
        next.adicional_plastificado = false;
        next.caras_adicional_laminado = "1";
        next.adicional_laminado = "sin_adicional";
        next.adicional_laca_uv = false;
        next.adicional_tinta_blanca = false;
        return next;
      }
      if (next.categoria_ui === "Bajadas Kraft") {
        if (!KRAFT_FORMATOS.includes(next.formato)) next.formato = "A3";
        if (!CARAS.includes(next.caras)) next.caras = "4/0";
        next.tipo_papel = KRAFT_TIPO_PAPEL;
        next.material = KRAFT_MATERIAL;
        if (!KRAFT_GRAMAJES.includes(next.gramaje)) next.gramaje = KRAFT_GRAMAJES[0];
        return next;
      }
      if (next.categoria_ui === "Tarjetas Personales 9x5") {
        next.formato = "9x5";
        if (!TARJETAS_CARAS.includes(next.caras)) next.caras = "4/0";
        if (!TARJETAS_GRAMAJES.includes(next.gramaje_tarjetas)) next.gramaje_tarjetas = "300g";
        next.tipo_papel = `${next.gramaje_tarjetas} Ilustracion`;
        next.material = `${next.gramaje_tarjetas} Ilustracion`;
        next.gramaje = next.gramaje_tarjetas;
        if (!TARJETAS_CANTIDADES.includes(String(next.cantidad_unidades))) next.cantidad_unidades = "100";
        if (!TARJETAS_TERMINACIONES.some((t) => t.value === next.terminacion_tarjetas)) next.terminacion_tarjetas = "sin_laminar";
        next.adicional_laminado = "sin_adicional";
        return next;
      }
      if (next.categoria_ui === "Tarjetas Postales") {
        next.formato = "postal";
        if (!POSTALES_CARAS.includes(next.caras)) next.caras = "4/0";
        if (!POSTALES_GRAMAJES.includes(next.gramaje_tarjetas)) next.gramaje_tarjetas = "300g";
        next.tipo_papel = `${next.gramaje_tarjetas} Ilustracion`;
        next.material = `${next.gramaje_tarjetas} Ilustracion`;
        next.gramaje = next.gramaje_tarjetas;
        if (!POSTALES_CANTIDADES.includes(String(next.cantidad_unidades))) next.cantidad_unidades = "100";
        if (!POSTALES_TERMINACIONES.some((t) => t.value === next.terminacion_tarjetas)) next.terminacion_tarjetas = "sin_laminar";
        next.adicional_laminado = "sin_adicional";
        return next;
      }
      if (next.categoria_ui === "Folletos") {
        next.formato = "10x15";
        if (!FOLLETOS_CANTIDADES.includes(String(next.cantidad_unidades))) next.cantidad_unidades = "100";
        if (!FOLLETOS_MODO_COLOR.includes(next.modo_color_folleto)) next.modo_color_folleto = "fullcolor";
        if (!FOLLETOS_PAPELES.find((p) => p.papel === next.papel_folleto)) next.papel_folleto = FOLLETOS_PAPELES[0].papel;
        next.tipo_papel = next.papel_folleto;
        next.material = next.papel_folleto;
        next.gramaje = FOLLETOS_PAPELES.find((p) => p.papel === next.papel_folleto)?.gramaje || "150g";
        const validCaras = next.modo_color_folleto === "fullcolor" ? ["4/0", "4/4"] : ["1/0", "1/1"];
        if (!validCaras.includes(next.caras)) next.caras = validCaras[0];
        next.adicional_laminado = "sin_adicional";
        return next;
      }
      if (next.categoria_ui === "Carpetas") {
        next.formato = "A4";
        if (!CARPETAS_CARAS.includes(next.caras)) next.caras = "4/0";
        next.tipo_papel = CARPETAS_PAPEL;
        next.material = CARPETAS_PAPEL;
        next.gramaje = CARPETAS_GRAMAJE;
        if (!CARPETAS_TERMINACIONES.some((t) => t.value === next.terminacion_carpetas)) next.terminacion_carpetas = "sin_laminar";
        if (!Number.isInteger(Number(next.cantidad_unidades)) || Number(next.cantidad_unidades) < 1) next.cantidad_unidades = "1";
        next.adicional_laminado = "sin_adicional";
        return next;
      }
      if (next.categoria_ui === "Sobres") {
        next.formato = "sobre";
        next.caras = "4/0";
        next.tipo_papel = "63g";
        next.material = "blanco";
        next.gramaje = "63g";
        if (!SOBRES_TIPOS.some((s) => s.value === next.tipo_sobre)) next.tipo_sobre = SOBRES_TIPOS[0].value;
        if (!SOBRES_CANTIDADES.includes(String(next.cantidad_unidades))) next.cantidad_unidades = "100";
        next.adicional_laminado = "sin_adicional";
        return next;
      }
      if (next.categoria_ui === "Stickers Corte Recto") {
        if (!STICKERS_FORMATOS.includes(next.formato)) next.formato = STICKERS_FORMATOS[0];
        next.caras = "4/0";
        next.tipo_papel = "sticker";
        next.material = "Sticker";
        next.gramaje = "N/A";
        if (!STICKERS_CANTIDADES.includes(String(next.cantidad_unidades))) next.cantidad_unidades = "100";
        if (!STICKERS_TERMINACIONES.some((t) => t.value === next.terminacion_stickers)) next.terminacion_stickers = "sin_laca_uv";
        next.adicional_laminado = "sin_adicional";
        return next;
      }
      if (next.categoria_ui === "Imanes Corte Recto") {
        if (!IMANES_FORMATOS.includes(next.formato)) next.formato = IMANES_FORMATOS[0];
        next.caras = "4/0";
        next.tipo_papel = "300g Ilustracion";
        next.material = "300g Ilustracion";
        next.gramaje = "300g";
        if (!IMANES_CANTIDADES.includes(String(next.cantidad_unidades))) next.cantidad_unidades = "100";
        if (!IMANES_TERMINACIONES.some((t) => t.value === next.terminacion_imanes)) next.terminacion_imanes = "sin_laca_uv";
        next.adicional_laminado = "sin_adicional";
        return next;
      }
      if (next.categoria_ui === "Stickers Circulares") {
        if (!STICKERS_CIRCULARES_FORMATOS.includes(next.formato)) next.formato = STICKERS_CIRCULARES_FORMATOS[0];
        next.caras = "4/0";
        next.tipo_papel = "sticker_circular";
        next.material = next.material_stickers_circulares || STICKERS_CIRCULARES_MATERIALES[0].value;
        next.gramaje = "N/A";
        if (!STICKERS_CIRCULARES_CANTIDADES.includes(String(next.cantidad_unidades))) next.cantidad_unidades = "100";
        if (!STICKERS_CIRCULARES_TERMINACIONES.some((t) => t.value === next.terminacion_stickers_circulares)) next.terminacion_stickers_circulares = "sin_laca_uv";
        if (!STICKERS_CIRCULARES_MATERIALES.some((m) => m.value === next.material_stickers_circulares)) next.material_stickers_circulares = STICKERS_CIRCULARES_MATERIALES[0].value;
        next.adicional_laminado = "sin_adicional";
        return next;
      }
      if (next.categoria_ui === "Tarjetas Troqueladas Circulares") {
        if (!TARJETAS_TROQ_CIRC_FORMATOS.includes(next.formato)) next.formato = TARJETAS_TROQ_CIRC_FORMATOS[0];
        if (!["4/0", "4/4"].includes(next.caras_tarjetas_troq_circ)) next.caras_tarjetas_troq_circ = "4/4";
        next.caras = next.caras_tarjetas_troq_circ;
        next.tipo_papel = "300g Ilustracion";
        next.material = "300g Ilustracion";
        next.gramaje = "300g";
        if (!TARJETAS_TROQ_CIRC_CANTIDADES.includes(String(next.cantidad_unidades))) next.cantidad_unidades = "100";
        next.adicional_laminado = "sin_adicional";
        if (!["sin_adicional", "laminado_brillo", "laminado_mate"].includes(next.adicional_laminado_troq_circ)) next.adicional_laminado_troq_circ = "sin_adicional";
        if (!["0", "1", "2"].includes(String(next.caras_adicional_troq_circ))) next.caras_adicional_troq_circ = "0";
        return next;
      }
      if (next.categoria_ui === "Plancha de Imán Impreso") {
        next.formato = "30x46";
        next.caras = "4/0";
        next.tipo_papel = "300g Ilustracion";
        next.material = "Imán 0.3mm";
        next.gramaje = "N/A";
        if (!PLANCHA_IMAN_VARIANTES.some((v) => v.value === next.variante_plancha_iman)) next.variante_plancha_iman = PLANCHA_IMAN_VARIANTES[0].value;
        if (!PLANCHA_IMAN_CANTIDADES_SUGERIDAS.includes(String(next.cantidad_unidades))) next.cantidad_unidades = "1";
        next.adicional_laminado = "sin_adicional";
        return next;
      }
      if (next.categoria_ui === "Agendas / Cuadernos") {
        if (!AGENDAS_PRODUCTOS.some((v) => v.value === next.producto_agendas)) next.producto_agendas = AGENDAS_PRODUCTOS[0].value;
        if (!AGENDAS_FORMATOS.includes(next.formato_agendas)) next.formato_agendas = "A5";
        if (!AGENDAS_PAGINAS.includes(String(next.paginas_agendas))) next.paginas_agendas = "24";
        next.formato = next.formato_agendas;
        next.caras = "N/A";
        next.tipo_papel = "300g tapas";
        next.material = "Promocional";
        next.gramaje = "N/A";
        if (Number(next.cantidad_unidades) < 2) next.cantidad_unidades = "2";
        next.adicional_laminado = "sin_adicional";
        next.adicional_troquelado = false;
        return next;
      }
      if (!next.categoria_ui.startsWith("Bajadas")) {
        next.adicional_laminado = "sin_adicional";
        next.adicional_troquelado = false;
      }
      if (!effectiveFormatoOptions.includes(next.formato)) next.formato = effectiveFormatoOptions[0] || "";
      return next;
    });
  }, [AGENDAS_FORMATOS, AGENDAS_PAGINAS, AGENDAS_PRODUCTOS, AUTOADH_FORMATOS, CARAS, CARPETAS_CARAS, CARPETAS_GRAMAJE, CARPETAS_PAPEL, CARPETAS_TERMINACIONES, FOLLETOS_CANTIDADES, FOLLETOS_MODO_COLOR, FOLLETOS_PAPELES, IMANES_CANTIDADES, IMANES_FORMATOS, IMANES_TERMINACIONES, KRAFT_FORMATOS, KRAFT_GRAMAJES, KRAFT_MATERIAL, KRAFT_TIPO_PAPEL, PLANCHA_IMAN_CANTIDADES_SUGERIDAS, PLANCHA_IMAN_VARIANTES, POSTALES_CANTIDADES, POSTALES_CARAS, POSTALES_GRAMAJES, POSTALES_TERMINACIONES, SOBRES_CANTIDADES, SOBRES_TIPOS, STICKERS_CANTIDADES, STICKERS_CIRCULARES_CANTIDADES, STICKERS_CIRCULARES_FORMATOS, STICKERS_CIRCULARES_MATERIALES, STICKERS_CIRCULARES_TERMINACIONES, STICKERS_FORMATOS, STICKERS_TERMINACIONES, TARJETAS_CANTIDADES, TARJETAS_CARAS, TARJETAS_GRAMAJES, TARJETAS_TERMINACIONES, TARJETAS_TROQ_CIRC_CANTIDADES, TARJETAS_TROQ_CIRC_FORMATOS, effectiveFormatoOptions]);

  useEffect(() => {
    setForm((prev) => {
      const next = { ...prev };
      if (
        next.categoria_ui === "Bajadas Autoadhesivas" ||
        next.categoria_ui === "Tarjetas Personales 9x5" ||
        next.categoria_ui === "Tarjetas Postales" ||
        next.categoria_ui === "Folletos" ||
        next.categoria_ui === "Carpetas" ||
        next.categoria_ui === "Sobres" ||
        next.categoria_ui === "Stickers Corte Recto" ||
        next.categoria_ui === "Imanes Corte Recto" ||
        next.categoria_ui === "Stickers Circulares" ||
        next.categoria_ui === "Tarjetas Troqueladas Circulares" ||
        next.categoria_ui === "Plancha de Imán Impreso" ||
        next.categoria_ui === "Agendas / Cuadernos"
      ) {
        return next;
      }
      if (next.categoria_ui === "Bajadas Kraft") {
        next.tipo_papel = KRAFT_TIPO_PAPEL;
        next.material = KRAFT_MATERIAL;
        if (!KRAFT_GRAMAJES.includes(next.gramaje)) next.gramaje = KRAFT_GRAMAJES[0];
        return next;
      }
      if (!tipoPapelOptions.includes(next.tipo_papel)) next.tipo_papel = tipoPapelOptions[0] || "";
      if (!materialOptions.includes(next.material)) next.material = materialOptions[0] || "";
      if (!gramajeOptions.includes(next.gramaje)) next.gramaje = gramajeOptions[0] || "";
      return next;
    });
  }, [KRAFT_GRAMAJES, KRAFT_MATERIAL, KRAFT_TIPO_PAPEL, tipoPapelOptions, materialOptions, gramajeOptions]);

  useEffect(() => {
    setForm((prev) => {
      const allowed = new Set(adicionalesDisponibles.map((a) => a.value));
      if (!allowed.has(prev.adicional_laminado)) {
        return { ...prev, adicional_laminado: "sin_adicional" };
      }
      return prev;
    });
  }, [adicionalesDisponibles]);

  useEffect(() => {
    if (!isFolletos) return;
    setForm((prev) => {
      const next = { ...prev };
      const paper = FOLLETOS_PAPELES.find((p) => p.papel === next.papel_folleto) || FOLLETOS_PAPELES[0];
      next.tipo_papel = paper.papel;
      next.material = paper.papel;
      next.gramaje = paper.gramaje;
      const allowedCaras = next.modo_color_folleto === "fullcolor" ? ["4/0", "4/4"] : ["1/0", "1/1"];
      if (!allowedCaras.includes(next.caras)) next.caras = allowedCaras[0];
      return next;
    });
  }, [FOLLETOS_PAPELES, isFolletos, form.papel_folleto, form.modo_color_folleto]);

  useEffect(() => {
    if (!isTarjetasTroqCirc) return;
    setForm((prev) => {
      if (prev.adicional_laminado_troq_circ === "sin_adicional" && prev.caras_adicional_troq_circ !== "0") {
        return { ...prev, caras_adicional_troq_circ: "0" };
      }
      if (prev.adicional_laminado_troq_circ !== "sin_adicional" && prev.caras_adicional_troq_circ === "0") {
        return { ...prev, caras_adicional_troq_circ: "1" };
      }
      return prev;
    });
  }, [isTarjetasTroqCirc, form.adicional_laminado_troq_circ]);

  const missingFields = useMemo(() => {
    const required = isAutoadhesivas
      ? ["urgencia", "columna_precio"]
      : isTarjetas
      ? ["formato", "tipo_papel", "material", "gramaje", "caras", "urgencia", "terminacion_tarjetas"]
      : isPostales
      ? ["formato", "tipo_papel", "material", "gramaje", "caras", "urgencia", "terminacion_tarjetas"]
      : isFolletos
      ? ["formato", "tipo_papel", "material", "gramaje", "caras", "urgencia", "modo_color_folleto"]
      : isCarpetas
      ? ["formato", "tipo_papel", "material", "gramaje", "caras", "urgencia", "terminacion_carpetas"]
      : isSobres
      ? ["tipo_sobre", "tipo_papel", "material", "gramaje", "caras", "urgencia"]
      : isStickers
      ? ["formato", "terminacion_stickers", "urgencia"]
      : isImanes
      ? ["formato", "tipo_papel", "material", "gramaje", "terminacion_imanes", "urgencia"]
      : isStickersCirculares
      ? ["formato", "material_stickers_circulares", "terminacion_stickers_circulares", "urgencia"]
      : isTarjetasTroqCirc
      ? ["formato", "caras_tarjetas_troq_circ", "urgencia"]
      : isPlanchaIman
      ? ["variante_plancha_iman", "urgencia"]
      : isAgendasCuadernos
      ? ["producto_agendas", "formato_agendas", "paginas_agendas", "urgencia"]
      : ["formato", "tipo_papel", "material", "gramaje", "caras", "urgencia"];
    return required.filter((field) => !String(form[field] ?? "").trim());
  }, [form, isAutoadhesivas, isTarjetas, isPostales, isFolletos, isCarpetas, isSobres, isStickers, isImanes, isStickersCirculares, isTarjetasTroqCirc, isPlanchaIman, isAgendasCuadernos]);

  const updateField = (field) => (event) => {
    setCopyStatus("");
    const value = event.target.value;
    if (field === "categoria_ui" && value === "Bajadas Fullcolor/ByN") {
      setForm((prev) => ({
        ...prev,
        categoria_ui: value,
        formato: "A3+",
      }));
      return;
    }
    setForm((prev) => ({ ...prev, [field]: value }));
  };

  const handleClear = () => {
    setForm((prev) => ({
      ...prev,
      cantidad_unidades:
        prev.categoria_ui === "Tarjetas Personales 9x5" ||
        prev.categoria_ui === "Tarjetas Postales" ||
        prev.categoria_ui === "Folletos" ||
        prev.categoria_ui === "Sobres" ||
        prev.categoria_ui === "Stickers Corte Recto" ||
        prev.categoria_ui === "Imanes Corte Recto" ||
        prev.categoria_ui === "Stickers Circulares" ||
        prev.categoria_ui === "Tarjetas Troqueladas Circulares"
          ? "100"
          : prev.categoria_ui === "Agendas / Cuadernos"
          ? "2"
          : "1",
      urgencia: "normal",
      adicional_laminado: "sin_adicional",
      caras_adicional_laminado: "1",
      adicional_tinta_blanca: false,
      adicional_laca_uv: false,
      adicional_troquelado: false,
      complejidad_troquelado: "simple",
      terminacion_tarjetas: "sin_laminar",
      gramaje_tarjetas: "300g",
      terminacion_carpetas: "sin_laminar",
      terminacion_stickers: "sin_laca_uv",
      terminacion_imanes: "sin_laca_uv",
      material_stickers_circulares: STICKERS_CIRCULARES_MATERIALES[0].value,
      terminacion_stickers_circulares: "sin_laca_uv",
      caras_tarjetas_troq_circ: "4/4",
      adicional_laminado_troq_circ: "sin_adicional",
      caras_adicional_troq_circ: "0",
      variante_plancha_iman: PLANCHA_IMAN_VARIANTES[0].value,
      producto_agendas: AGENDAS_PRODUCTOS[0].value,
      formato_agendas: "A5",
      paginas_agendas: "24",
      solapa_impresa: false,
      tipo_sobre: SOBRES_TIPOS[0].value,
      papel_folleto: "150g Ilustracion",
      modo_color_folleto: "fullcolor",
    }));
    setResult(null);
    setLastPayload(null);
    setError("");
    setCopyStatus("");
    setLoading(false);
  };

  return {
    form,
    setForm,
    inferred,
    isAutoadhesivas,
    isKraft,
    isTarjetas,
    isPostales,
    isFolletos,
    isCarpetas,
    isSobres,
    isStickers,
    isImanes,
    isStickersCirculares,
    isTarjetasTroqCirc,
    isPlanchaIman,
    isAgendasCuadernos,
    isNoRangeProduct,
    isBajadasFlow,
    isMatrixProduct,
    isLivianoBajadaNoAutoadhesiva,
    adicionalesDisponibles,
    formatoDataSource,
    validRows,
    formatoOptions,
    effectiveFormatoOptions,
    tipoPapelOptions,
    materialOptions,
    gramajeOptions,
    cantidadOptions,
    cantidadUnidades,
    derivedRange,
    missingFields,
    updateField,
    handleClear,
  };
}
