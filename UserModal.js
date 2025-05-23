import React, { useState } from 'react';
import { 
  View, 
  Text, 
  Button, 
  TextInput, 
  Alert, 
  ActivityIndicator, 
  Platform, 
  TouchableOpacity, 
  Modal, 
  StyleSheet 
} from 'react-native';
import { auth, db } from './services/firebase_service';
import { createUserWithEmailAndPassword } from 'firebase/auth';
import { doc, setDoc } from 'firebase/firestore';
import { DateTimePickerAndroid } from '@react-native-community/datetimepicker';
import { styles } from './app/styles/modal_style';

export const UserModal = ({ visible, onClose }) => {
    const [userMail, setUserMail] = useState('');
    const [cnpj, setCnpj] = useState('');
    const [loading, setLoading] = useState(false);
    const SENHA_PADRAO = "admin1";
    const [licenses, setLicenses] = useState('');
    const [terminate, setTerminate] = useState(new Date());
    const [showDatePicker, setShowDatePicker] = useState(false);

    const handleDateChange = (event, selectedDate) => {
        const currentDate = selectedDate || terminate;
        setTerminate(currentDate);
        if (Platform.OS === 'android') {
            DateTimePickerAndroid.dismiss('date');
        }
    };

    const showDatepicker = () => {
        if (Platform.OS === 'web') {
            setShowDatePicker(true);
        } else {
            DateTimePickerAndroid.open({
                value: terminate,
                onChange: handleDateChange,
                mode: 'date',
                display: 'default'
            });
        }
    };

    const cadastrarUsuario = async () => {
        if (!userMail || !cnpj) {
            Alert.alert('Atenção', 'Preencha todos os campos!');
            return;
        }

        if (cnpj.length !== 14 || !/^\d+$/.test(cnpj)) {
            Alert.alert('Atenção', 'CNPJ deve conter 14 dígitos numéricos');
            return;
        }

        if (!userMail.includes('@') || !userMail.includes('.')) {
            Alert.alert('Atenção', 'Por favor, insira um e-mail válido');
            return;
        }

        setLoading(true);

        try {
            const userCredential = await createUserWithEmailAndPassword(auth, userMail, SENHA_PADRAO);
            const user = userCredential.user;

            await setDoc(doc(db, 'usuarios', user.uid), {
                email: userMail,
                cnpj: cnpj,
                licenses: Number(licenses),
                used: 0,
                inicio: new Date(),
                terminate: terminate,
            });

            await setDoc(doc(db, cnpj, 'default'), {});

            Alert.alert('Sucesso', `Usuário ${userMail} cadastrado com sucesso!`);
            setUserMail('');
            setCnpj('');
            setLicenses('');
            setTerminate(new Date());
            onClose();
        } catch (error) {
            let errorMessage = 'Erro ao cadastrar';
            switch(error.code) {
                case 'auth/email-already-in-use':
                    errorMessage = 'Este e-mail já está cadastrado';
                    break;
                case 'auth/invalid-email':
                    errorMessage = 'E-mail inválido';
                    break;
                default:
                    errorMessage = error.message;
            }
            Alert.alert('Erro', errorMessage);
        } finally {
            setLoading(false);
        }
    };

    return (
        <Modal
            visible={visible}
            animationType="none"
            transparent={true}
            onRequestClose={onClose}
        >
            <View style={styles.modalOverlay}>
                <View style={styles.modalContainer}>
                    <Text style={styles.title}>Novo Usuário</Text>
                    
                    <TextInput 
                        placeholder='E-mail' 
                        style={styles.input}
                        value={userMail} 
                        onChangeText={setUserMail}
                        keyboardType="email-address"
                        autoCapitalize="none"
                    />
                    
                    <TextInput 
                        placeholder='CNPJ (apenas números)' 
                        style={styles.input}
                        value={cnpj} 
                        onChangeText={setCnpj}
                        keyboardType="numeric"
                        maxLength={14}
                    />

                    <Text style={styles.text}>Senha padrão: admin1</Text>

                    <TextInput 
                        placeholder='Quantidade de Licenças' 
                        style={styles.input}
                        value={licenses} 
                        onChangeText={setLicenses}
                        keyboardType="numeric"
                    />

                    {Platform.OS === 'web' ? (
                        <input
                            type="date"
                            value={terminate.toISOString().split('T')[0]}
                            onChange={(e) => setTerminate(new Date(e.target.value))}
                            style={styles.webDateInput}
                        />
                    ) : (
                        <TouchableOpacity onPress={showDatepicker} style={styles.dateButton}>
                            <Text>Selecionar Data: {terminate.toLocaleDateString()}</Text>
                        </TouchableOpacity>
                    )}
                    
                    <View style={styles.buttonContainer}>
                        <Button
                            title="Cadastrar"
                            onPress={cadastrarUsuario}
                            disabled={loading}
                        />
                        <Button
                            title="Fechar"
                            onPress={onClose}
                        />
                    </View>
                </View>
            </View>
        </Modal>
    );
};