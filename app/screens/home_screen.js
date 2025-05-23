import React, { useEffect, useState } from 'react';
import { View, Text, Button, TextInput, Alert, ActivityIndicator, Platform, TouchableOpacity } from 'react-native';
import { auth, db } from '../../services/firebase_service';
import { onAuthStateChanged, signOut, createUserWithEmailAndPassword } from 'firebase/auth';
import { doc, setDoc, collection } from 'firebase/firestore';
import { styles } from '../styles/home_style';

import { DateTimePickerAndroid } from '@react-native-community/datetimepicker';

export default function HomeScreen({ navigation }) {
    const [userMail, setUserMail] = useState('');
    const [cnpj, setCnpj] = useState('');
    const [loading, setLoading] = useState(false);
    const SENHA_PADRAO = "admin1";
    const [licenses, setLicenses] = useState('');
    const [terminate, setTerminate] = useState(new Date());
    const [showDatePicker, setShowDatePicker] = useState(false);

    useEffect(() => {
        const unsubscribe = onAuthStateChanged(auth, (user) => {
            if (!user) {
                navigation.replace('Login');
            }
        });
        return unsubscribe;
    }, []);

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

    if (loading) {
        return (
            <View style={styles.container}>
                <ActivityIndicator size="large" color="#0000ff" />
                <Text>Cadastrando usuário...</Text>
            </View>
        );
    }

    return (
        <View style={styles.containerhome}>
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

            <Text
                style={styles.text}
                padding={10}
                marginBottom={10}
            >Senha padrão: admin1</Text>

            <TextInput 
                placeholder='Quantidade de Licenças' 
                style={styles.input}
                value={licenses} 
                onChangeText={setLicenses}
                keyboardType="numeric"
            />

            {Platform.OS === 'web' ? (
                <>
                    <input
                        type="date"
                        value={terminate.toISOString().split('T')[0]}
                        onChange={(e) => setTerminate(new Date(e.target.value))}
                        style={styles.webDateInput}
                    />
                </>
            ) : (
                <TouchableOpacity onPress={showDatepicker} style={styles.dateButton}>
                    <Text>Selecionar Data: {terminate.toLocaleDateString()}</Text>
                </TouchableOpacity>
            )}
            
            <Button
                title="Cadastrar"
                onPress={cadastrarUsuario}
                disabled={loading}
            />
            
            <Button
                title="Voltar"
                onPress={() => {
                    navigation.replace('Dashboard');
                }}
            />
        </View>
    );
}