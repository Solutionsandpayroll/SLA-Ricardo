
"use client";

import "./clientes.css";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2, Plus, Trash2, Users, X, Globe, Building2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

interface ClienteFila {
  id: string;
  nombre: string;
  dominio: string;
  pais: string | null;
  solicitudes: number;
}

const campo = "clientes-input";

export function ClientesManager({
  clientes,
}: {
  clientes: ClienteFila[];
}) {
  const router = useRouter();

  const [mostrarForm, setMostrarForm] = useState(false);
  const [guardando, setGuardando] = useState(false);
  const [eliminando, setEliminando] = useState<string | null>(null);
  const [error, setError] = useState("");

  const [nombre, setNombre] = useState("");
  const [dominio, setDominio] = useState("");
  const [pais, setPais] = useState("");

  const cerrarForm = () => {
    setMostrarForm(false);
    setError("");
    setNombre("");
    setDominio("");
    setPais("");
  };

  const crearCliente = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setGuardando(true);
    setError("");

    try {
      const res = await fetch("/api/clientes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          nombre: nombre.trim(),
          dominio: dominio.trim(),
          pais: pais.trim(),
        }),
      });

      const data = await res.json();

      if (!res.ok || !data.success) {
        throw new Error(data.error || "No se pudo crear el cliente.");
      }

      cerrarForm();
      router.refresh();
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Error al crear el cliente."
      );
    } finally {
      setGuardando(false);
    }
  };

  const eliminarCliente = async (cliente: ClienteFila) => {
    const confirmar = window.confirm(
      `¿Estás segura de que deseas eliminar a "${cliente.nombre}"?`
    );

    if (!confirmar) return;

    setEliminando(cliente.id);

    try {
      const res = await fetch(
        `/api/clientes?id=${encodeURIComponent(cliente.id)}`,
        { method: "DELETE" }
      );

      const data = await res.json();

      if (!res.ok || !data.success) {
        throw new Error(data.error || "No se pudo eliminar el cliente.");
      }

      router.refresh();
    } catch (err) {
      window.alert(
        err instanceof Error
          ? err.message
          : "Error al eliminar el cliente."
      );
    } finally {
      setEliminando(null);
    }
  };

  return (
    <div className="clientes-page">
      <div className="clientes-header">
        <div className="clientes-header-info">
          <span className="clientes-eyebrow">GESTIÓN EMPRESARIAL</span>
          <h1 className="clientes-title">Clientes</h1>
          <p className="clientes-subtitle">
            Administra los clientes, sus dominios y las solicitudes asociadas.
          </p>
        </div>

        {!mostrarForm && (
          <Button
            className="clientes-btn clientes-btn-primary"
            onClick={() => setMostrarForm(true)}
          >
            <Plus className="mr-2 h-4 w-4" />
            Nuevo cliente
          </Button>
        )}
      </div>

      <div className="clientes-stats">
        <Card className="clientes-stat-card">
          <CardContent className="clientes-stat-content">
            <div className="clientes-stat-icon clientes-icon-blue">
              <Users size={22} />
            </div>
            <div>
              <p className="clientes-stat-label">Total de clientes</p>
              <h2 className="clientes-stat-number">{clientes.length}</h2>
            </div>
          </CardContent>
        </Card>

        <Card className="clientes-stat-card">
          <CardContent className="clientes-stat-content">
            <div className="clientes-stat-icon clientes-icon-red">
              <Globe size={22} />
            </div>
            <div>
              <p className="clientes-stat-label">Dominios registrados</p>
              <h2 className="clientes-stat-number">
                {clientes.filter((c) => c.dominio).length}
              </h2>
            </div>
          </CardContent>
        </Card>

        <Card className="clientes-stat-card">
          <CardContent className="clientes-stat-content">
            <div className="clientes-stat-icon clientes-icon-purple">
              <Building2 size={22} />
            </div>
            <div>
              <p className="clientes-stat-label">Solicitudes asociadas</p>
              <h2 className="clientes-stat-number">
                {clientes.reduce((total, c) => total + c.solicitudes, 0)}
              </h2>
            </div>
          </CardContent>
        </Card>
      </div>

      {mostrarForm && (
        <Card className="clientes-card clientes-form-card">
          <CardHeader className="clientes-card-header">
            <div>
              <CardTitle className="clientes-card-title">
                Registrar cliente
              </CardTitle>
              <CardDescription className="clientes-card-description">
                Completa los datos para registrar un nuevo cliente.
              </CardDescription>
            </div>

            <Button
              type="button"
              variant="ghost"
              size="icon"
              className="clientes-close-btn"
              onClick={cerrarForm}
              aria-label="Cerrar formulario"
            >
              <X className="h-5 w-5" />
            </Button>
          </CardHeader>

          <CardContent>
            <form onSubmit={crearCliente} className="clientes-form">
              <div className="clientes-form-grid">
                <div className="clientes-field">
                  <label htmlFor="cliente-nombre">Nombre del cliente</label>
                  <input
                    id="cliente-nombre"
                    className={campo}
                    value={nombre}
                    onChange={(e) => setNombre(e.target.value)}
                    placeholder="Ej. Acme SAS"
                    required
                  />
                </div>

                <div className="clientes-field">
                  <label htmlFor="cliente-dominio">Dominio del correo</label>
                  <input
                    id="cliente-dominio"
                    className={campo}
                    value={dominio}
                    onChange={(e) => setDominio(e.target.value)}
                    placeholder="Ej. acme.com"
                    required
                  />
                  <span className="clientes-field-help">
                    Ingresa el dominio sin @.
                  </span>
                </div>

                <div className="clientes-field">
                  <label htmlFor="cliente-pais">País</label>
                  <input
                    id="cliente-pais"
                    className={campo}
                    value={pais}
                    onChange={(e) => setPais(e.target.value)}
                    placeholder="Ej. Colombia"
                  />
                  <span className="clientes-field-help">Campo opcional.</span>
                </div>
              </div>

              {error && (
                <div className="clientes-error" role="alert">
                  {error}
                </div>
              )}

              <div className="clientes-form-actions">
                <Button
                  type="submit"
                  className="clientes-btn clientes-btn-primary"
                  disabled={guardando}
                >
                  {guardando ? (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  ) : (
                    <Plus className="mr-2 h-4 w-4" />
                  )}
                  {guardando ? "Guardando..." : "Guardar cliente"}
                </Button>

                <Button
                  type="button"
                  variant="outline"
                  className="clientes-btn clientes-btn-secondary"
                  onClick={cerrarForm}
                  disabled={guardando}
                >
                  Cancelar
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}

      <Card className="clientes-card">
        <CardHeader className="clientes-card-header">
          <div>
            <CardTitle className="clientes-card-title">
              Lista de clientes
            </CardTitle>
            <CardDescription className="clientes-card-description">
              Consulta los clientes registrados y los dominios utilizados para
              identificar sus solicitudes.
            </CardDescription>
          </div>

          <span className="clientes-count">
            {clientes.length} {clientes.length === 1 ? "cliente" : "clientes"}
          </span>
        </CardHeader>

        <CardContent className="clientes-table-container">
          <Table className="clientes-table">
            <TableHeader>
              <TableRow className="clientes-table-header">
                <TableHead>Cliente</TableHead>
                <TableHead>Dominio</TableHead>
                <TableHead>País</TableHead>
                <TableHead>Solicitudes</TableHead>
                <TableHead className="clientes-actions-heading">
                  Acciones
                </TableHead>
              </TableRow>
            </TableHeader>

            <TableBody>
              {clientes.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5}>
                    <div className="clientes-empty">
                      <div className="clientes-empty-icon">
                        <Users size={34} />
                      </div>
                      <h3>No hay clientes registrados</h3>
                      <p>
                        Agrega tu primer cliente para comenzar a gestionar sus
                        dominios y solicitudes.
                      </p>

                      {!mostrarForm && (
                        <Button
                          className="clientes-btn clientes-btn-primary"
                          onClick={() => setMostrarForm(true)}
                        >
                          <Plus className="mr-2 h-4 w-4" />
                          Agregar cliente
                        </Button>
                      )}
                    </div>
                  </TableCell>
                </TableRow>
              ) : (
                clientes.map((cliente) => (
                  <TableRow
                    key={cliente.id}
                    className="clientes-table-row"
                  >
                    <TableCell>
                      <div className="clientes-name-cell">
                        <div className="clientes-avatar">
                          {cliente.nombre.trim().charAt(0).toUpperCase()}
                        </div>
                        <span className="clientes-name">
                          {cliente.nombre}
                        </span>
                      </div>
                    </TableCell>

                    <TableCell>
                      <span className="clientes-domain">
                        {cliente.dominio}
                      </span>
                    </TableCell>

                    <TableCell>
                      <span className="clientes-country">
                        {cliente.pais || "No especificado"}
                      </span>
                    </TableCell>

                    <TableCell>
                      <span className="clientes-request-count">
                        {cliente.solicitudes}
                      </span>
                    </TableCell>

                    <TableCell className="clientes-actions-cell">
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        className="clientes-delete-btn"
                        onClick={() => eliminarCliente(cliente)}
                        disabled={eliminando === cliente.id}
                        aria-label={`Eliminar ${cliente.nombre}`}
                        title="Eliminar cliente"
                      >
                        {eliminando === cliente.id ? (
                          <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                          <Trash2 className="h-4 w-4" />
                        )}
                      </Button>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
