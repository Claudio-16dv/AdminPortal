"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import styles from "../../page.module.css";
import { toast } from "react-toastify";

export default function Edit() {
  const router = useRouter();
  const [clients, setClients] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [openId, setOpenId] = useState(null);
  const [details, setDetails] = useState({});
  const [formState, setFormState] = useState({});
  const [addrOpen, setAddrOpen] = useState({});
  const [modalClientId, setModalClientId] = useState(null);


  const fetchClients = async () => {
    try {
      const res = await fetch("http://localhost:8000/clients/list", {
        credentials: "include",
        headers: { "Content-Type": "application/json" },
      });
      if (res.status === 401) {
        router.push("/");
        return;
      }
  
      const data = await res.json();
      setClients(data);
  
      const newDetails = {};
      const newFormState = {};
  
      for (const client of data) {
        newDetails[client.id] = client;
        newFormState[client.id] = client;
      }
  
      setDetails(newDetails);
      setFormState(newFormState);
    } catch {
      setError("Falha ao buscar clientes");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchClients();
  }, [router]);

  const toggleClient = async (id) => {
    if (openId === id) {
      setOpenId(null);
      return;
    }

    if (!details[id]) {
      const res = await fetch(`http://localhost:8000/clients/edit/${id}`, {
        credentials: "include",
        headers: { "Content-Type": "application/json" },
      });
      if (res.status === 401) {
        router.push("/");
        return;
      }
      const data = await res.json();

      const safeData = {
        name: data.name ?? "",
        birthdate: data.birthdate ?? "",
        cpf: data.cpf ?? "",
        rg: data.rg ?? "",
        phone: data.phone ?? "",
        addresses: Array.isArray(data.addresses) ? data.addresses : [],
      };

      setDetails((prev) => ({ ...prev, [id]: safeData }));
      setFormState((prev) => ({ ...prev, [id]: safeData }));
    }

    setOpenId(id);
  };

  const toggleAddr = (clientId, idx) => {
    setAddrOpen((prev) => ({
      ...prev,
      [clientId]: prev[clientId] === idx ? null : idx,
    }));
  };

  const handleChange = (clientId, field, value) => {
    setFormState((prev) => ({
      ...prev,
      [clientId]: {
        ...prev[clientId],
        [field]: value,
      },
    }));
  };

  const handleAddrChange = (clientId, index, field, value) => {
    const updatedAddresses = [...formState[clientId].addresses];
    updatedAddresses[index] = { ...updatedAddresses[index], [field]: value };
    setFormState((prev) => ({
      ...prev,
      [clientId]: {
        ...prev[clientId],
        addresses: updatedAddresses,
      },
    }));
  };

  const handleAddAddress = (clientId) => {
    const newAddress = {
      street: "",
      number: "",
      neighborhood: "",
      city: "",
      state: "",
      zip_code: "",
      complement: "",
    };
  
    setFormState((prev) => ({
      ...prev,
      [clientId]: {
        ...prev[clientId],
        addresses: [...(prev[clientId]?.addresses || []), newAddress],
      },
    }));
  };

  const handleCancelNewAddress = (clientId, index) => {
    const updated = formState[clientId].addresses.filter((_, i) => i !== index);
  
    setFormState((prev) => ({
      ...prev,
      [clientId]: {
        ...prev[clientId],
        addresses: updated,
      },
    }));
  };

  const handleDeleteClient = (clientId) => {
    setModalClientId(clientId);
  };

  const confirmDeleteClient = async () => {
    const clientId = modalClientId;
    if (!clientId) return;
  
    try {
      const res = await fetch(`http://localhost:8000/clients/delete/${clientId}`, {
        method: "DELETE",
        credentials: "include",
      });
  
      if (!res.ok) {
        throw new Error(data.message || data.error || "Erro ao deletar o cliente.");
      }
  
      toast.success("Cliente deletado com sucesso!");
  
      setClients((prev) => prev.filter((c) => c.id !== clientId));
      setOpenId(null);
      setModalClientId(null);
      fetchClients();
    } catch (err) {
      toast.error(err.message || "Erro ao deletar cliente.");
    }
  };

  const handleSave = async (clientId) => {
    const clientData = formState[clientId];

    const hasInvalidAddress = clientData.addresses.some(addr => {
      if (!addr.id) {
        return (
          !addr.street.trim() ||
          !addr.number.trim() ||
          !addr.neighborhood.trim() ||
          !addr.city.trim() ||
          !addr.state.trim() ||
          !addr.zip_code.trim()
        );
      }
      return false;
    });
  
    if (hasInvalidAddress) {
      toast.error("Preencha todos os campos dos novos endereços antes de salvar.");
      return;
    }

    try {
      const res = await fetch(`http://localhost:8000/clients/update/${clientId}`, {
        method: "PUT",
        credentials: "include",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(formState[clientId]),
      });
  
      const data = await res.json();
  
      if (!res.ok) {
        throw new Error(data.message || data.error || "Erro ao salvar alterações.");
      }
  
      toast.success("Cliente atualizado com sucesso!");
      const updatedClient = data;
  
      setDetails(prev => ({ ...prev, [clientId]: updatedClient }));
      setFormState(prev => ({ ...prev, [clientId]: updatedClient }));
      fetchClients();
    } catch (err) {
      toast.error(err.message || "Erro inesperado.");
    }
  };

  const hasChanges = (clientId) => {
    const original = JSON.stringify(details[clientId]);
    const edited = JSON.stringify(formState[clientId]);
    return original !== edited;
  };

  const formatDateToDMY = (date) => {
    const [year, month, day] = date.split("-");
    return `${day}/${month}/${year}`;
  };

  const hasInvalidAddress = (clientId) => {
    return formState[clientId]?.addresses?.some(addr => {
      if (!addr.id) {
        return (
          !addr.street?.trim() ||
          !addr.number?.trim() ||
          !addr.neighborhood?.trim() ||
          !addr.city?.trim() ||
          !addr.state?.trim() ||
          !addr.zip_code?.trim()
        );
      }
      return false;
    });
  };

  if (loading) return <p className={styles.loadingText}>Carregando…</p>;
  if (error) return <p className={styles.errorMsg}>{error}</p>;

  return (
    <div className={styles.wrapperMain}>
      <div className={styles.clientContainer}>
        <h1 className={styles.headingMain}>Clientes</h1>

        {clients.map((c) => (
          <div key={c.id} className={styles.clientCard}>
            <div className={styles.clientHeader}>
              <span>{c.name}</span>
              <button className={styles.btnToggle} onClick={() => toggleClient(c.id)}>
                {openId === c.id ? "Fechar" : "Ver Dados"}
              </button>
            </div>

            {openId === c.id && formState[c.id] && formState[c.id].name !== undefined && (
              <div className={styles.clientDetails}>
                <input className={styles.inputField} value={formState[c.id].name} onChange={(e) => handleChange(c.id, "name", e.target.value)} placeholder="Nome" />
                <input className={styles.inputField} value={formatDateToDMY(formState[c.id].birthdate)} onChange={(e) => handleChange(c.id, "birthdate", formatDateToISO(e.target.value))} placeholder="Data de Nascimento" />
                <input className={styles.inputField} value={formState[c.id].cpf} onChange={(e) => handleChange(c.id, "cpf", e.target.value)} placeholder="CPF" />
                <input className={styles.inputField} value={formState[c.id].rg} onChange={(e) => handleChange(c.id, "rg", e.target.value)} placeholder="RG" />
                <input className={styles.inputField} value={formState[c.id].phone} onChange={(e) => handleChange(c.id, "phone", e.target.value)} placeholder="Telefone" />

                <h3 className={styles.addressTitle}>Endereços</h3>
                {Array.isArray(formState[c.id]?.addresses) && formState[c.id].addresses.map((addr, idx) => (
                    <div key={idx} className={styles.addressWrapper}>
                        <div className={styles.addressHeader}>
                        <span>{addr.street || "Novo endereço"}</span>

                        {addr.id ? (
                            <span
                            className={addrOpen[c.id] === idx ? styles.iconCollapse : styles.iconExpand}
                            onClick={() => toggleAddr(c.id, idx)}
                            >
                            {addrOpen[c.id] === idx ? "▴" : "▾"}
                            </span>
                        ) : (
                            <span
                            className={styles.closeNewAddress}
                            onClick={() => handleCancelNewAddress(c.id, idx)}
                            >
                            ✕
                            </span>
                        )}
                        </div>

                        {(!addr.id || addrOpen[c.id] === idx) && (
                        <div className={styles.addressDetails}>
                            <input className={styles.inputField} value={addr.street} onChange={(e) => handleAddrChange(c.id, idx, "street", e.target.value)} placeholder="Rua"/>
                            <input className={styles.inputField} value={addr.number} onChange={(e) => handleAddrChange(c.id, idx, "number", e.target.value)} placeholder="Número"/>
                            <input className={styles.inputField} value={addr.neighborhood} onChange={(e) => handleAddrChange(c.id, idx, "neighborhood", e.target.value)} placeholder="Bairro"/>
                            <input className={styles.inputField} value={addr.city} onChange={(e) => handleAddrChange(c.id, idx, "city", e.target.value)} placeholder="Cidade"/>
                            <input className={styles.inputField} value={addr.state} onChange={(e) => handleAddrChange(c.id, idx, "state", e.target.value)} placeholder="UF"/>
                            <input className={styles.inputField} value={addr.zip_code} onChange={(e) => handleAddrChange(c.id, idx, "zip_code", e.target.value)} placeholder="CEP"/>
                            <input className={styles.inputField} value={addr.complement} onChange={(e) => handleAddrChange(c.id, idx, "complement", e.target.value)} placeholder="Complemento"/>
                        </div>
                        )}
                    </div>
                ))}

                <div className={styles.buttonGroup}>
                <button className={styles.btnSave} disabled={!hasChanges(c.id) || hasInvalidAddress(c.id)} onClick={() => handleSave(c.id)}>
                  Salvar Alterações
                </button>
                <button className={styles.btnAction} onClick={() => handleAddAddress(c.id)}>
                    Adicionar Endereço
                </button>
                <button className={styles.btnDanger} onClick={() => handleDeleteClient(c.id)}>
                    Deletar Cliente
                </button>
                </div>
              </div>
            )}
          </div>
        ))}
        <button className={styles.menuBtn} onClick={() => router.push("/home")}>
          Voltar
        </button>
      </div>

      {modalClientId !== null && (
        <div className={styles.modalOverlay}>
            <div className={styles.modalBox}>
            <h2 className={styles.modalTitle}>Deseja mesmo excluir este cliente?</h2>
            <div className={styles.modalActions}>
                <button className={styles.btnModalConfirm} onClick={() => confirmDeleteClient()}>
                Confirmar
                </button>
                <button className={styles.btnModalCancel} onClick={() => setModalClientId(null)}>
                Cancelar
                </button>
            </div>
            </div>
        </div>
        )}
    </div>
  );
}
