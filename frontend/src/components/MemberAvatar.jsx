
function MemberAvatar({ user, size = 35 }) {
  const name = user?.name || "User";
  const initials = name
    .split(" ")
    .map((part) => part[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

  return (
    <div style={styles.container}>
      {user?.avatar ? (
        <img
          src={user.avatar}
          alt={name}
          style={{
            width: size,
            height: size,
            borderRadius: "50%",
            objectFit: "cover"
          }}
        />
      ) : (
        <div style={{
          ...styles.avatar,
          width: size,
          height: size,
          fontSize: size / 2.5
        }}>
          {initials}
        </div>
      )}

      <span>{name}</span>
    </div>
  );
}

const styles = {
  container: {
    display: "flex",
    alignItems: "center",
    gap: 9,
    fontSize: 13,
    color: "#334155"
  },
  avatar: {
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    borderRadius: "50%",
    background: "#e0e7ff",
    color: "#4338ca",
    fontWeight: 700
  }
};

export default MemberAvatar;
