import React, { useState } from 'react';
import { 
  View, 
  Text, 
  TextInput, 
  Alert, 
  ActivityIndicator, 
  Platform, 
  TouchableOpacity, 
  Modal, 
  ScrollView,
  KeyboardAvoidingView
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
    const [licenses, setLicenses] = useState('');
    const [terminate, setTerminate] = useState(new Date());
    const [showDatePicker, setShowDatePicker] = useState(false);
    const [errors, setErrors] = useState({});
    
    const SENHA_PADRAO = "admin1";

    // Função para formatar CNPJ
    const formatCNPJ = (value) => {
        const numericValue = value.replace(/\D/g, '');
        if (numericValue.length <= 2) return numericValue;
        if (numericValue.length <= 5) return `${numericValue.slice(0, 2)}.${numericValue.slice(2)}`;
        if (numericValue.length <= 8) return `${numericValue.slice(0, 2)}.${numericValue.slice(2, 5)}.${numericValue.slice(5)}`;
        if (numericValue.length <= 12) return `${numericValue.slice(0, 2)}.${numericValue.slice(2, 5)}.${numericValue.slice(5, 8)}/${numericValue.slice(8)}`;
        return `${numericValue.slice(0, 2)}.${numericValue.slice(2, 5)}.${numericValue.slice(5, 8)}/${numericValue.slice(8, 12)}-${numericValue.slice(12, 14)}`;
    };

    const handleCNPJChange = (text) => {
        const formatted = formatCNPJ(text);
        setCnpj(formatted);
        if (errors.cnpj) {
            setErrors(prev => ({ ...prev, cnpj: null }));
        }
    };

    const handleEmailChange = (text) => {
        setUserMail(text);
        if (errors.userMail) {
            setErrors(prev => ({ ...prev, userMail: null }));
        }
    };

    const handleLicensesChange = (text) => {
        setLicenses(text);
        if (errors.licenses) {
            setErrors(prev => ({ ...prev, licenses: null }));
        }
    };

    const validateForm = () => {
        const newErrors = {};

        if (!userMail.trim()) {
            newErrors.userMail = 'E-mail é obrigatório';
        } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(userMail)) {
            newErrors.userMail = 'E-mail inválido';
        }

        const cnpjNumbers = cnpj.replace(/\D/g, '');
        if (!cnpjNumbers) {
            newErrors.cnpj = 'CNPJ é obrigatório';
        } else if (cnpjNumbers.length !== 14) {
            newErrors.cnpj = 'CNPJ deve conter 14 dígitos';
        }

        if (!licenses.trim()) {
            newErrors.licenses = 'Quantidade de licenças é obrigatória';
        } else if (isNaN(licenses) || parseInt(licenses) <= 0) {
            newErrors.licenses = 'Insira um número válido maior que 0';
        }

        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

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
        if (!validateForm()) {
            return;
        }

        setLoading(true);

        try {
            const userCredential = await createUserWithEmailAndPassword(auth, userMail, SENHA_PADRAO);
            const user = userCredential.user;

            await setDoc(doc(db, 'usuarios', user.uid), {
                email: userMail,
                cnpj: cnpj.replace(/\D/g, ''),
                licenses: Number(licenses),
                used: 0,
                inicio: new Date(),
                terminate: terminate,
            });

            await setDoc(doc(db, cnpj.replace(/\D/g, ''), 'default'), {});

            Alert.alert('Sucesso', `Usuário ${userMail} cadastrado com sucesso!`);
            resetForm();
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
                case 'auth/weak-password':
                    errorMessage = 'Senha muito fraca';
                    break;
                default:
                    errorMessage = error.message;
            }
            Alert.alert('Erro', errorMessage);
        } finally {
            setLoading(false);
        }
    };

    const resetForm = () => {
        setUserMail('');
        setCnpj('');
        setLicenses('');
        setTerminate(new Date());
        setErrors({});
    };

    const handleClose = () => {
        resetForm();
        onClose();
    };

    return (
        <Modal
            visible={visible}
            animationType="fade"
            transparent={true}
            onRequestClose={handleClose}
        >
            <TouchableOpacity 
                style={styles.modalOverlay} 
                activeOpacity={1} 
                onPress={handleClose}
            >
                <View style={styles.modalContainer}>
                    <TouchableOpacity activeOpacity={1} onPress={() => {}}>
                        {/* Header */}
                        <View style={styles.header}>
                            <Text style={styles.title}>Novo Usuário</Text>
                            <TouchableOpacity onPress={handleClose} style={styles.closeButton}>
                                <Text style={styles.closeButtonText}>✕</Text>
                            </TouchableOpacity>
                        </View>
                        
                        {/* Form Fields */}
                        <View style={styles.formContainer}>
                            {/* Email Field */}
                            <View style={styles.fieldContainer}>
                                <Text style={styles.label}>E-mail *</Text>
                                <TextInput 
                                    placeholder='Digite o e-mail'
                                    style={[styles.input, errors.userMail && styles.inputError]}
                                    value={userMail} 
                                    onChangeText={handleEmailChange}
                                    keyboardType="email-address"
                                    autoCapitalize="none"
                                    autoCorrect={false}
                                />
                                {errors.userMail && (
                                    <Text style={styles.errorText}>{errors.userMail}</Text>
                                )}
                            </View>
                            
                            {/* CNPJ Field */}
                            <View style={styles.fieldContainer}>
                                <Text style={styles.label}>CNPJ *</Text>
                                <TextInput 
                                    placeholder='00.000.000/0000-00'
                                    style={[styles.input, errors.cnpj && styles.inputError]}
                                    value={cnpj} 
                                    onChangeText={handleCNPJChange}
                                    keyboardType="numeric"
                                    maxLength={18}
                                />
                                {errors.cnpj && (
                                    <Text style={styles.errorText}>{errors.cnpj}</Text>
                                )}
                            </View>

                            {/* Password Info */}
                            <View style={styles.infoContainer}>
                                <Text style={styles.infoText}>
                                    🔒 Senha: <Text style={styles.passwordText}>admin1</Text>
                                </Text>
                            </View>

                            {/* Licenses Field */}
                            <View style={styles.fieldContainer}>
                                <Text style={styles.label}>Licenças *</Text>
                                <TextInput 
                                    placeholder='Ex: 10'
                                    style={[styles.input, errors.licenses && styles.inputError]}
                                    value={licenses} 
                                    onChangeText={handleLicensesChange}
                                    keyboardType="numeric"
                                />
                                {errors.licenses && (
                                    <Text style={styles.errorText}>{errors.licenses}</Text>
                                )}
                            </View>

                            {/* Date Field */}
                            <View style={styles.fieldContainer}>
                                <Text style={styles.label}>Data Término</Text>
                                {Platform.OS === 'web' ? (
                                    <input
                                        type="date"
                                        value={terminate.toISOString().split('T')[0]}
                                        onChange={(e) => setTerminate(new Date(e.target.value))}
                                        style={styles.webDateInput}
                                    />
                                ) : (
                                    <TouchableOpacity onPress={showDatepicker} style={styles.dateButton}>
                                        <Text style={styles.dateButtonText}>
                                            📅 {terminate.toLocaleDateString('pt-BR')}
                                        </Text>
                                    </TouchableOpacity>
                                )}
                            </View>
                        </View>
                        
                        {/* Action Buttons */}
                        <View style={styles.actionContainer}>
                            <TouchableOpacity 
                                style={[styles.button, styles.cancelButton]} 
                                onPress={handleClose}
                                disabled={loading}
                            >
                                <Text style={styles.cancelButtonText}>Cancelar</Text>
                            </TouchableOpacity>
                            
                            <TouchableOpacity 
                                style={[styles.button, styles.submitButton, loading && styles.buttonDisabled]} 
                                onPress={cadastrarUsuario}
                                disabled={loading}
                            >
                                {loading ? (
                                    <ActivityIndicator size="small" color="#fff" />
                                ) : (
                                    <Text style={styles.submitButtonText}>Cadastrar</Text>
                                )}
                            </TouchableOpacity>
                        </View>
                    </TouchableOpacity>
                </View>
            </TouchableOpacity>
        </Modal>
    );
};