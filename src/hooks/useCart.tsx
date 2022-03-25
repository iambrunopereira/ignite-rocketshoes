import { createContext, ReactNode, useContext, useState } from 'react';
import { toast } from 'react-toastify';
import { api } from '../services/api';
import { Product, Stock } from '../types';

interface CartProviderProps {
  children: ReactNode;
}

interface UpdateProductAmount {
  productId: number;
  amount: number;
}

interface CartContextData {
  cart: Product[];
  addProduct: (productId: number) => Promise<void>;
  removeProduct: (productId: number) => void;
  updateProductAmount: ({ productId, amount }: UpdateProductAmount) => void;
}

const CartContext = createContext<CartContextData>({} as CartContextData);

export function CartProvider({ children }: CartProviderProps): JSX.Element {
  const [cart, setCart] = useState<Product[]>(() => {
     const storagedCart = localStorage.getItem('@RocketShoes:cart');

     if (storagedCart) {
       return JSON.parse(storagedCart);
     }

    return [];
  });

  const addProduct = async (productId: number) => {
    try {
      const updatedCart = [...cart];
      const currentProduct = updatedCart.find(product => product.id === productId) as Product ;

      const { data: productStock }: { data: Stock } = await api.get(`/stock/${productId}`) ;


      if (productStock.amount <= 0 || (currentProduct && (currentProduct.amount + 1) > productStock.amount)) {

        toast.error('Quantidade solicitada fora de estoque');
        return;
      }

      if(!currentProduct) {
        
        const { data: product }: {data: Product} = await api.get(`/products/${productId}`);
        updatedCart.push({...product, amount: 1});

      }else{
        currentProduct.amount += 1;
      }
      
      setCart(updatedCart);
      localStorage.setItem('@RocketShoes:cart', JSON.stringify(updatedCart));
    
    } catch (err){
      toast.error('Erro na adição do produto');
    }
  };

  const removeProduct = (productId: number) => {
    try {
      let updatedCart = [...cart]
      let currentProduct = updatedCart.find(product => product.id === productId) as Product;

      if(!currentProduct) {
        throw new Error('Produto não encontrado');
      }

      updatedCart = updatedCart.filter(productInCart => productInCart.id !== productId)
      
      setCart(updatedCart);
      localStorage.setItem('@RocketShoes:cart', JSON.stringify(updatedCart));
    } catch {
      toast.error('Erro na remoção do produto');
    }
  };

  const updateProductAmount = async ({
    productId,
    amount,
  }: UpdateProductAmount) => {
    try {
      
      if (amount <= 0) {
        return;
      }

      let updatedCart = [...cart]
      let currentProduct = updatedCart.find(product => product.id === productId) as Product;

      const { data: productStock }: { data: Stock } = await api.get(`/stock/${productId}`);


      if (amount <= 0 || amount > productStock.amount) {

        toast.error('Quantidade solicitada fora de estoque');
        return;
      }

      currentProduct.amount = amount;

      setCart(updatedCart);
      localStorage.setItem('@RocketShoes:cart', JSON.stringify(updatedCart));
  
    } catch {
      toast.error('Erro na alteração de quantidade do produto');
    }
  };

  return (
    <CartContext.Provider
      value={{ cart, addProduct, removeProduct, updateProductAmount }}
    >
      {children}
    </CartContext.Provider>
  );
}

export function useCart(): CartContextData {
  const context = useContext(CartContext);

  return context;
}
