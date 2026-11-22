import logo from '../../../../assets/icons/logo-nav.png';

export default function BookCover({ look }) {
  return (
    <span className="book-cover" aria-hidden="true">
      <img className="book-cover__mark" src={logo} alt="" draggable="false" />
      <span className="book-cover__title">Look<b>book</b></span>
      {look && (
        <span className="book-cover__print">
          <img src={look.imageUrl} alt="" draggable="false" />
          <span>{look.title}</span>
        </span>
      )}
    </span>
  );
}
