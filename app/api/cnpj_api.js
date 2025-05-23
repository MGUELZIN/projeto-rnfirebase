import axios from 'axios';

const api = axios.create({
  baseURL: 'https://publica.cnpj.ws/cnpj',
});

export const fetchCNPJData = async (cnpj) => {
  try {
    const response = await api.get(cnpj);
    return response.data;
  } catch (error) {
    console.error('Error fetching CNPJ data:', error);
    throw error;
  }
}