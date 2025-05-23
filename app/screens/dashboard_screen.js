import { useState, useEffect } from 'react';
import { 
  FaBars, 
  FaTimes, 
  FaHome, 
  FaUser, 
  FaCog, 
  FaSignOutAlt,
  FaPlus
} from 'react-icons/fa';
import { Container, SidebarContainer, Overlay } from '../styles/sidebar_style';
import { signOut } from 'firebase/auth';
import { auth } from '../../services/firebase_service';
import { DataGrid } from '@mui/x-data-grid';
import { styles } from '../styles/dashboard_style';
import { collection, getDocs } from 'firebase/firestore';
import { db } from '../../services/firebase_service';
import { UserModal } from '../../UserModal';
import { fetchCNPJData } from '../api/cnpj_api';

export default function DashboardScreen({ navigation }) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modalVisible, setModalVisible] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');

  const toggleSidebar = () => {
    setSidebarOpen(!sidebarOpen);
  };

  const Header = () => {
    return (
      <Container>
        {sidebarOpen ? (
          <FaTimes onClick={toggleSidebar} color='black'/>
        ) : (
          <FaBars onClick={toggleSidebar} color='black'/>
        )}
      </Container>
    );
  };

  const columns = [
    { field: 'id', headerName: 'ID', width: 90 },
    { field: 'razaoSocial', headerName: 'Razão Social', width: 200 },
    { field: 'cnpj', headerName: 'CNPJ', width: 150 },
    { field: 'email', headerName: 'Email', width: 200 },
    { field: 'licenses', headerName: 'Licenças', width: 120 },
    { field: 'inicio', headerName: 'Início', width: 150 },
    { field: 'terminate', headerName: 'Término', width: 150 },
  ];

  useEffect(() => {
    const fetchUsers = async () => {
      try {
        const querySnapshot = await getDocs(collection(db, 'usuarios'));
        const usersData = [];
        
        for (const doc of querySnapshot.docs) {
          const user = doc.data();
          let razaoSocial = 'Não informado';

          if (user.cnpj) {
            try {
              const cnpjData = await fetchCNPJData(user.cnpj);
              razaoSocial = cnpjData.razao_social || 'Não informado';
            } catch (error) {
              console.error(`Erro ao buscar CNPJ ${user.cnpj}:`, error);
              razaoSocial = 'Erro ao buscar';
            }
          }

          usersData.push({
            id: doc.id,
            razaoSocial: razaoSocial,
            cnpj: user.cnpj || 'Não informado',
            email: user.email || 'Não informado',
            licenses: user.licenses || 0,
            inicio: user.inicio && user.inicio.toDate ? user.inicio.toDate().toLocaleDateString() : 'Não informado',
            terminate: user.terminate && user.terminate.toDate ? user.terminate.toDate().toLocaleDateString() : 'Não informado'
          });
        }
        
        setRows(usersData);
        setLoading(false);
      } catch (error) {
        console.error("Erro ao buscar usuários:", error);
        setLoading(false);
      }
    };

    fetchUsers();
  }, [modalVisible]);

  const filteredRows = rows.filter(row => 
    row.razaoSocial.toLowerCase().includes(searchTerm.toLowerCase()) ||
    row.cnpj.includes(searchTerm) ||
    row.email.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <>
      <Header />
      <SidebarContainer $isOpen={sidebarOpen}>
        <ul>
          <li>
            <FaHome style={{ marginRight: '10px' }} />
            Início
          </li>
          <li>
            <FaUser style={{ marginRight: '10px' }} />
            Perfil
          </li>
          <li>
            <FaCog style={{ marginRight: '10px' }} />
            Configurações
          </li>
          <li>
            <FaSignOutAlt style={{ marginRight: '10px' }} 
              onClick={() => {
                signOut(auth);
                navigation.replace('Login');
              }}
            />
            Sair
          </li>
        </ul>
      </SidebarContainer>
      <Overlay $isOpen={sidebarOpen} onClick={toggleSidebar} />
      
      <div style={{ padding: '20px', textAlign: 'center' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '20px' }}>
          <input 
            type="text" 
            placeholder="Pesquisar..." 
            style={styles.pesquisar}
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)} 
          />
          <button 
            style={styles.button}
            onClick={() => setModalVisible(true)}
          >
            <FaPlus style={{ marginRight: '5px' }} />
            Adicionar Usuário
          </button>
        </div>
        
        <h1 style={styles.title}>Painel AES</h1>

        <div style={{ height: 500, width: '100%', marginTop: '20px' }}>
          {loading ? (
            <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100%' }}>
              Carregando dados...
            </div>
          ) : filteredRows.length === 0 ? (
            <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100%' }}>
              {searchTerm ? 'Nenhum resultado encontrado' : 'Nenhum usuário cadastrado'}
            </div>
          ) : (
            <DataGrid
              rows={filteredRows}
              columns={columns}
              pageSize={5}
              rowsPerPageOptions={[5, 10, 20]}
              checkboxSelection
              localeText={{
                noRowsLabel: 'Nenhum registro encontrado',
                footerRowSelected: count => `${count.toLocaleString()} linha(s) selecionada(s)`,
              }}
              sx={{
                '& .MuiDataGrid-cell:hover': {
                  color: 'primary.main',
                },
              }}
            />
          )}
        </div>
      </div>

      <UserModal 
        visible={modalVisible} 
        onClose={() => setModalVisible(false)}
      />
    </>
  );
}