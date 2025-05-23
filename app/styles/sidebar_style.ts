import styled from 'styled-components';

interface SidebarProps {
  $isOpen: boolean;
}

export const Container = styled.div`
  
  > svg {
    position: fixed;
    color: white;
    width: 30px;
    height: 30px;
    top: 32px;
    left: 32px;
    cursor: pointer;
    z-index: 20;
  }
`;

export const SidebarContainer = styled.div<SidebarProps>`
  position: fixed;
  top: 0;
  left: ${({ $isOpen }) => ($isOpen ? '0' : '-250px')};
  width: 250px;
  height: 100vh;
  background-color: #f8f9fa;
  box-shadow: 2px 0 10px rgba(0, 0, 0, 0.1);
  transition: left 0.3s ease-in-out;
  z-index: 15;
  padding-top: 80px;
  ul {
    list-style: none;
    padding: 0;
    margin: 0;

    li {
      padding: 12px 20px;
      display: flex;
      align-items: center;
      cursor: pointer;
      transition: background-color 0.2s;

      &:hover {
        background-color: #e9ecef;
      }
    }
  }
`;

export const Overlay = styled.div<SidebarProps>`
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100vh;
  background-color: rgba(0, 0, 0, 0.5);
  z-index: 14;
  display: ${({ $isOpen }) => ($isOpen ? 'block' : 'none')};
`;
