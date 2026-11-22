import { getContexto } from "@/server/contexto";
import { LeitorCamera } from "@/components/escanear/leitor-camera";
export default async function Escanear() {
  await getContexto();
  return (
    <>
      <div className="titulo">
        <div>
          <h1>Escanear</h1>
          <p className="subtitulo">
            Leia localizações e itens pela câmera ou digite o código.
          </p>
        </div>
      </div>
      <LeitorCamera />
    </>
  );
}
